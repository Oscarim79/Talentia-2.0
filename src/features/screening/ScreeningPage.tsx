import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText, UploadCloud, Sparkles, RotateCcw } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { useCandidates } from '../../context/CandidatesContext';
import { providers } from '../../core/providers';
import { AI_SCREENING_LABEL } from '../../core/config';
import { MAX_FILE_MB, cvPathFor } from '../../core/adapters/supabaseScreening';
import { canRetry, screeningErrorLabel } from '../../core/screeningErrors';
import type { ScreenOutcome } from '../../core/ports';
import { todayISO } from '../../lib/dates';
import { newId } from '../../lib/utils';
import { runPool } from '../../lib/runPool';
import { CvLink } from '../../components/CvLink';
import type { Candidate, Job } from '../../types';
import { makePendingCandidate, nameFromFile, outcomeToPatch, pendingState } from './screeningResult';
import {
  Card,
  PageHeader,
  Badge,
  Button,
  ProgressBar,
  scoreVariant,
} from '../../components/ui/primitives';

/** Estado de un lote en proceso (barra de progreso por lote). */
interface BatchState {
  total: number;
  done: number;
  current: string;
}

const ACCEPTED = '.pdf,.docx,.png,.jpg,.jpeg';
/** CVs que se leen a la vez (cada lectura tarda varios segundos). */
const CONCURRENCY = 3;
const EMPTY_SET: ReadonlySet<string> = new Set();

export default function ScreeningPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const [jobId, setJobId] = useState(jobs[0]?.id ?? '');
  const job = jobs.find((j) => j.id === jobId);

  // Los candidatos viven en CandidatesContext (Supabase): siguen aquí al volver y llegan a Respuestas a CVs.
  const { candidates, addCandidate, updateCandidateFields } = useCandidates();
  const list = useMemo(() => candidates.filter((c) => c.jobId === jobId), [candidates, jobId]);
  const [tab, setTab] = useState<'ranked' | 'errors'>('ranked');
  const [batch, setBatch] = useState<BatchState | null>(null);
  // Lecturas en curso en esta pestaña (para distinguir "leyendo" de "quedó pendiente").
  const [inFlight, setInFlight] = useState<ReadonlySet<string>>(EMPTY_SET);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Identifica el contexto empresa+vacante vigente: al cambiar, el lote en curso
  // deja de tocar la barra de progreso (sus resultados sí se guardan en cada candidato).
  const runRef = useRef(0);
  const busy = batch !== null;

  useEffect(() => {
    runRef.current += 1;
    setBatch(null);
    setTab('ranked');
  }, [tenant.id, jobId]);

  // Si cambia el tenant y la vacante seleccionada ya no le pertenece, ajusta
  useEffect(() => {
    if (!jobs.some((j) => j.id === jobId)) setJobId(jobs[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const pending = list.filter((c) => c.screeningStatus === 'pending');
  const ranked = list
    .filter((c) => c.screeningStatus === 'scored')
    .sort((a, b) => (b.screeningScore ?? 0) - (a.screeningScore ?? 0));
  const errors = list.filter((c) => c.screeningStatus === 'error');

  function track(id: string, on: boolean) {
    setInFlight((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function screenOne(input: { file: File; candidateId: string; cvPath: string }): Promise<ScreenOutcome> {
    try {
      return await providers.cvScreening.screen(input);
    } catch {
      return { ok: false, errorReason: 'ai_error' };
    }
  }

  // Núcleo del pipeline real: por cada archivo, candidato pendiente → subir → leer con IA → resultado.
  async function processFiles(files: File[]) {
    if (!job || busy || files.length === 0) return;
    const run = runRef.current;
    const currentJob = job;
    let done = 0;
    setBatch({ total: files.length, done, current: files[0].name });

    await runPool(files, CONCURRENCY, async (file) => {
      const id = newId('cand');
      const cvPath = cvPathFor(tenant.id, id, file.name);
      const provisional = makePendingCandidate(file, currentJob, id, cvPath, todayISO());
      addCandidate(provisional);
      track(id, true);
      if (runRef.current === run) setBatch({ total: files.length, done, current: file.name });

      const outcome = await screenOne({ file, candidateId: id, cvPath });

      track(id, false);
      // El resultado se guarda aunque el usuario haya cambiado de vacante (el candidato ya existe en la base).
      updateCandidateFields(id, outcomeToPatch(outcome, provisional, todayISO()));
      done += 1;
      if (runRef.current === run) setBatch({ total: files.length, done, current: done < files.length ? file.name : '' });
    });

    if (runRef.current !== run) return;
    setBatch({ total: files.length, done: files.length, current: '' });
    // Deja ver el 100% un instante antes de cerrar la barra.
    await new Promise((r) => setTimeout(r, 500));
    if (runRef.current !== run) return;
    setBatch(null);
    setTab('ranked');
  }

  /** Vuelve a pedir la lectura con el archivo ya guardado (no hay que subirlo de nuevo). */
  async function retry(c: Candidate) {
    if (busy || inFlight.has(c.id)) return;
    updateCandidateFields(c.id, { screeningStatus: 'pending', stage: 'screening', errorReason: undefined });
    track(c.id, true);
    let outcome: ScreenOutcome;
    try {
      outcome = await providers.cvScreening.retry(c.id);
    } catch {
      outcome = { ok: false, errorReason: 'ai_error' };
    }
    track(c.id, false);
    updateCandidateFields(c.id, outcomeToPatch(outcome, { firstName: c.firstName, lastName: c.lastName }, todayISO()));
    setTab(outcome.ok ? 'ranked' : 'errors');
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    handleFiles(e.dataTransfer.files);
  }

  // CVs de ejemplo (SIMULADOS, sin costo): presentan el flujo sin archivos reales a mano.
  async function loadSamples() {
    if (!job || busy) return;
    const run = runRef.current;
    const stamp = Math.floor(performance.now());
    const names = [
      `Maria_Gonzalez_CV_${stamp}.pdf`,
      `Carlos_Ramirez_Hoja_de_Vida_${stamp}.pdf`,
      `Ana_Lopez_${stamp}.pdf`,
      `Jose_Morales_scan_${stamp}.pdf`, // ilegible → cola de errores
    ];
    const mustHaves = job.filters.filter((f) => f.polarity === 'positive').map((f) => f.criterion);
    const negatives = job.filters.filter((f) => f.polarity === 'negative').map((f) => f.criterion);
    setBatch({ total: names.length, done: 0, current: names[0] });

    for (let i = 0; i < names.length; i++) {
      const file = names[i];
      setBatch({ total: names.length, done: i, current: file });
      const res = await providers.cvParser.parse(file);
      if (runRef.current !== run) return; // lote viejo: descartar, no contaminar el tenant nuevo
      if (!res.ok || !res.parsed) {
        addCandidate(makeErrorCandidate(file, job, res.errorReason));
        continue;
      }
      const score = await providers.llm.scoreCandidate({ jobTitle: job.title, mustHaves, niceToHaves: [], negatives, parsed: res.parsed });
      if (runRef.current !== run) return;
      addCandidate(makeScoredCandidate(file, job, res.parsed, score));
    }

    setBatch({ total: names.length, done: names.length, current: '' });
    await new Promise((r) => setTimeout(r, 500));
    if (runRef.current !== run) return;
    setBatch(null);
    setTab('ranked');
  }

  const pct = batch ? Math.round((batch.done / batch.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Screening IA"
        subtitle="Carga masiva de CVs → lectura → puntaje con evidencia. Una persona filtra cientos."
        actions={
          <Button variant="secondary" onClick={loadSamples} disabled={busy || !job}>
            <Sparkles className="h-4 w-4" />
            CVs de ejemplo (simulados)
          </Button>
        }
      />

      <Badge variant="brand" className="mb-4">
        Los CVs los lee y puntúa {AI_SCREENING_LABEL}; el archivo original queda guardado para el equipo. "CVs de ejemplo"
        sigue simulado y no cuesta nada.
      </Badge>

      {/* Contexto de la vacante + filtros */}
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Vacante</span>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              disabled={busy}
              title={busy ? 'Espera a que termine el lote en proceso' : undefined}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-stone-500">
            {ranked.length} puntuados
            {pending.length > 0 && <> · <span className="text-brand-700">{pending.length} en proceso</span></>} ·{' '}
            <span className="text-red-600">{errors.length} con error</span>
          </div>
        </div>

        {job && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.filters.map((f) => (
              <Badge key={f.id} variant={f.polarity === 'positive' ? 'green' : 'red'}>
                {f.polarity === 'positive' ? '+' : '−'} {f.criterion}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Zona de carga real: arrastra y suelta o selecciona archivos */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        data-tour="screening:dropzone"
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click();
        }}
        className={`mb-5 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? 'border-brand-500 bg-brand-50'
            : busy
              ? 'cursor-not-allowed border-stone-200 bg-stone-50'
              : 'border-stone-300 bg-white hover:border-brand-400 hover:bg-stone-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // permite recargar el mismo archivo
          }}
        />

        {busy && batch ? (
          <div className="mx-auto max-w-md">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando lote… {batch.done}/{batch.total}
            </div>
            <ProgressBar value={pct} tone="brand" />
            <p className="mt-2 truncate text-xs text-stone-500">
              {batch.current ? <>Leyendo <span className="font-medium text-stone-700">{batch.current}</span></> : '¡Lote completado!'}
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-stone-700">
              Arrastra y suelta los CVs aquí
            </p>
            <p className="mt-1 text-xs text-stone-400">
              o <span className="font-medium text-brand-600">selecciona archivos</span> · PDF, Word (.docx) o imágenes · máximo {MAX_FILE_MB} MB · carga por lote
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-stone-400">
              <Upload className="h-3 w-3" /> Los escaneos ilegibles caen automáticamente en la cola de errores
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <TabButton active={tab === 'ranked'} onClick={() => setTab('ranked')}>
          Rankeados ({ranked.length})
        </TabButton>
        <TabButton active={tab === 'errors'} onClick={() => setTab('errors')}>
          Cola de errores ({errors.length})
        </TabButton>
      </div>

      {tab === 'ranked' ? (
        <div className="space-y-3">
          {pending.map((c) => (
            <PendingRow key={c.id} candidate={c} state={pendingState(c, inFlight) ?? 'stale'} onRetry={() => retry(c)} busy={busy} />
          ))}
          {ranked.length === 0 && pending.length === 0 && (
            <Card className="p-10 text-center text-sm text-stone-400">
              No hay candidatos puntuados. Suelta CVs arriba o pulsa <b>CVs de ejemplo</b> para ver el flujo.
            </Card>
          )}
          {ranked.map((c, i) => (
            <CandidateRow key={c.id} rank={i + 1} candidate={c} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {errors.length === 0 && (
            <Card className="p-10 text-center text-sm text-stone-400">Sin errores de lectura. 🎉</Card>
          )}
          {errors.map((c) => (
            <ErrorRow key={c.id} candidate={c} onRetry={() => retry(c)} busy={busy} />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRow({ rank, candidate }: { rank: number; candidate: Candidate }) {
  const score = candidate.screeningScore ?? 0;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex w-8 shrink-0 flex-col items-center pt-1">
          <span className="text-lg font-black text-stone-300">#{rank}</span>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-stone-900">
              {candidate.firstName} {candidate.lastName}
            </p>
            <Badge variant="stone">{candidate.source}</Badge>
            {candidate.flags?.map((f) => (
              <Badge key={f} variant="red">
                <AlertTriangle className="h-3 w-3" /> {f}
              </Badge>
            ))}
          </div>

          <p className="mt-1.5 text-sm text-stone-600">{candidate.justification}</p>

          {/* Evidencia anclada al CV (anti-alucinación) */}
          {candidate.evidence && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.evidence.map((e) => (
                <span
                  key={e.criterion}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                    e.matched ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-400'
                  }`}
                  title={e.quote}
                >
                  {e.matched ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {e.criterion}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="w-28 shrink-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <Badge variant={scoreVariant(score)} className="text-sm">
              {score}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">match {candidate.matchPercent}%</p>
          <ProgressBar value={score} className="mt-2" />
          <div className="mt-2 flex justify-end">
            <CvLink cvPath={candidate.cvPath} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PendingRow({
  candidate,
  state,
  onRetry,
  busy,
}: {
  candidate: Candidate;
  state: 'processing' | 'stale';
  onRetry: () => void;
  busy: boolean;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">
        {state === 'processing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-800">
          {candidate.firstName} {candidate.lastName}
          <span className="ml-2 text-xs font-normal text-stone-400">{candidate.cvFileName}</span>
        </p>
        <p className="text-xs text-stone-500">
          {state === 'processing' ? 'Leyendo el CV…' : 'Quedó pendiente (la lectura no terminó). Puedes reintentar.'}
        </p>
      </div>
      {state === 'stale' && (
        <Button variant="secondary" onClick={onRetry} disabled={busy}>
          <RotateCcw className="h-4 w-4" /> Reintentar
        </Button>
      )}
    </Card>
  );
}

function ErrorRow({ candidate, onRetry, busy }: { candidate: Candidate; onRetry: () => void; busy: boolean }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <div className="rounded-lg bg-red-50 p-2.5 text-red-500">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-800">{candidate.cvFileName}</p>
        <p className="text-xs text-red-600">{screeningErrorLabel(candidate.errorReason)}</p>
      </div>
      <div className="flex items-center gap-2">
        <CvLink cvPath={candidate.cvPath} />
        {canRetry(candidate.errorReason) && (
          <Button variant="secondary" onClick={onRetry} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> Reintentar
          </Button>
        )}
      </div>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  );
}

// ---- builders para los CVs de ejemplo (simulados) ----

function makeScoredCandidate(
  file: string,
  job: Job,
  parsed: NonNullable<Candidate['parsed']>,
  score: { score: number; matchPercent: number; justification: string; evidence: Candidate['evidence']; flags: string[] },
): Candidate {
  const { firstName, lastName } = nameFromFile(file);
  return {
    id: newId('cand'),
    tenantId: job.tenantId,
    jobId: job.id,
    firstName,
    lastName,
    email: 'nuevo@mail.com',
    phone: '+502 0000 0000',
    source: 'Ejemplo simulado',
    stage: 'screening',
    appliedAt: todayISO(),
    cvFileName: file,
    screeningStatus: 'scored',
    screeningScore: score.score,
    matchPercent: score.matchPercent,
    justification: score.justification,
    evidence: score.evidence,
    flags: score.flags,
    parsed,
  };
}

function makeErrorCandidate(file: string, job: Job, reason?: string): Candidate {
  const { firstName, lastName } = nameFromFile(file);
  return {
    id: newId('cand'),
    tenantId: job.tenantId,
    jobId: job.id,
    firstName,
    lastName,
    email: '',
    phone: '',
    source: 'Ejemplo simulado',
    stage: 'applied',
    appliedAt: todayISO(),
    cvFileName: file,
    screeningStatus: 'error',
    errorReason: reason ?? 'illegible_pdf',
  };
}
