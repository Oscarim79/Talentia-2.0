import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText, UploadCloud, Sparkles } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { CANDIDATES } from '../../data/seed';
import { providers } from '../../core/providers';
import { newId } from '../../lib/utils';
import type { Candidate, Job } from '../../types';
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

const ACCEPTED = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

export default function ScreeningPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const jobs = allJobs.filter((j) => j.tenantId === tenant.id);
  const [jobId, setJobId] = useState(jobs[0]?.id ?? '');
  const job = jobs.find((j) => j.id === jobId);

  const [list, setList] = useState<Candidate[]>([]);
  const [tab, setTab] = useState<'ranked' | 'errors'>('ranked');
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Identifica el contexto empresa+vacante vigente: al cambiar, cualquier lote
  // en curso queda invalidado y sus resultados se descartan (aislamiento multi-tenant).
  const runRef = useRef(0);
  const busy = batch !== null;

  // Resetea la lista al cambiar de empresa o vacante (aislamiento por tenant)
  useEffect(() => {
    runRef.current += 1;
    setBatch(null);
    setList(CANDIDATES.filter((c) => c.tenantId === tenant.id && c.jobId === jobId));
    setTab('ranked');
  }, [tenant.id, jobId]);

  // Si cambia el tenant y la vacante seleccionada ya no le pertenece, ajusta
  useEffect(() => {
    if (!jobs.some((j) => j.id === jobId)) setJobId(jobs[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const ranked = list
    .filter((c) => c.screeningStatus === 'scored')
    .sort((a, b) => (b.screeningScore ?? 0) - (a.screeningScore ?? 0));
  const errors = list.filter((c) => c.screeningStatus === 'error');

  // Núcleo del pipeline: parsea + puntúa una lista de nombres de archivo,
  // actualizando la barra de progreso por cada uno (lote en vivo).
  async function processNames(fileNames: string[]) {
    if (!job || busy || fileNames.length === 0) return;
    const run = runRef.current; // si cambia empresa/vacante, este lote queda huérfano
    const mustHaves = job.filters.filter((f) => f.polarity === 'positive').map((f) => f.criterion);
    const negatives = job.filters.filter((f) => f.polarity === 'negative').map((f) => f.criterion);

    setBatch({ total: fileNames.length, done: 0, current: fileNames[0] });

    for (let i = 0; i < fileNames.length; i++) {
      const file = fileNames[i];
      setBatch({ total: fileNames.length, done: i, current: file });

      const res = await providers.cvParser.parse(file);
      if (runRef.current !== run) return; // lote viejo: descartar, no contaminar el tenant nuevo
      if (!res.ok || !res.parsed) {
        setList((prev) => [...prev, makeErrorCandidate(file, job, res.errorReason)]);
        continue;
      }
      const score = await providers.llm.scoreCandidate({
        jobTitle: job.title,
        mustHaves,
        niceToHaves: [],
        negatives,
        parsed: res.parsed,
      });
      if (runRef.current !== run) return;
      setList((prev) => [...prev, makeScoredCandidate(file, job, res.parsed!, score)]);
    }

    setBatch({ total: fileNames.length, done: fileNames.length, current: '' });
    // Deja ver el 100% un instante antes de cerrar la barra.
    await new Promise((r) => setTimeout(r, 500));
    if (runRef.current !== run) return;
    setBatch(null);
    setTab('ranked');
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    processNames(Array.from(files).map((f) => f.name));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    handleFiles(e.dataTransfer.files);
  }

  // CVs de ejemplo para presentar la demo sin archivos reales a mano.
  function loadSamples() {
    const stamp = Math.floor(performance.now());
    processNames([
      `Maria_Gonzalez_CV_${stamp}.pdf`,
      `Carlos_Ramirez_Hoja_de_Vida_${stamp}.pdf`,
      `Ana_Lopez_${stamp}.pdf`,
      `Jose_Morales_scan_${stamp}.pdf`, // ilegible → cola de errores
    ]);
  }

  const pct = batch ? Math.round((batch.done / batch.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Screening IA"
        subtitle="Carga masiva de CVs → parseo → scoring con evidencia. Una persona filtra cientos."
        actions={
          <Button variant="secondary" onClick={loadSamples} disabled={busy || !job}>
            <Sparkles className="h-4 w-4" />
            CVs de ejemplo
          </Button>
        }
      />

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
            {ranked.length} puntuados · <span className="text-red-600">{errors.length} con error</span>
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
              {batch.current ? <>Analizando <span className="font-medium text-stone-700">{batch.current}</span></> : '¡Lote completado!'}
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
              o <span className="font-medium text-brand-600">selecciona archivos</span> · PDF, DOC o imágenes · carga por lote
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
          {ranked.length === 0 && (
            <Card className="p-10 text-center text-sm text-stone-400">
              No hay candidatos puntuados. Suelta CVs arriba o pulsa <b>CVs de ejemplo</b> para ver el pipeline de IA en acción.
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
            <ErrorRow key={c.id} candidate={c} />
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
        </div>
      </div>
    </Card>
  );
}

const ERROR_LABELS: Record<string, string> = {
  illegible_pdf: 'PDF ilegible (escaneo/foto)',
  password_protected: 'PDF protegido con contraseña',
  corrupt: 'Archivo corrupto',
};

function ErrorRow({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="rounded-lg bg-red-50 p-2.5 text-red-500">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-stone-800">{candidate.cvFileName}</p>
        <p className="text-xs text-red-600">
          {ERROR_LABELS[candidate.errorReason ?? ''] ?? 'Error de lectura'} — requiere gestión manual
        </p>
      </div>
      <Button variant="secondary">Subir versión legible</Button>
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

// ---- builders para candidatos generados en vivo ----

const NAME_NOISE = /\b(cv|curriculum|curriculo|hoja|de|vida|resume|resumen|scan|foto|imagen|final|v\d+)\b/gi;

/** Deriva un nombre legible desde el nombre real del archivo subido. */
function nameFromFile(file: string): { firstName: string; lastName: string } {
  const base = file
    .replace(/\.[a-z0-9]+$/i, '') // extensión
    .replace(/[_\-.]+/g, ' ')
    .replace(NAME_NOISE, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = base
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  if (parts.length === 0) return { firstName: 'Nuevo', lastName: 'Candidato' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'CV' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

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
    source: 'Carga directa',
    stage: 'screening',
    appliedAt: '2026-06-15',
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
    source: 'Carga directa',
    stage: 'applied',
    appliedAt: '2026-06-15',
    cvFileName: file,
    screeningStatus: 'error',
    errorReason: reason ?? 'illegible_pdf',
  };
}
