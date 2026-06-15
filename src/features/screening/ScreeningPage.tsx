import { useEffect, useState, type ReactNode } from 'react';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { JOBS, CANDIDATES } from '../../data/seed';
import { providers } from '../../core/providers';
import type { Candidate, Job } from '../../types';
import {
  Card,
  PageHeader,
  Badge,
  Button,
  ProgressBar,
  scoreVariant,
} from '../../components/ui/primitives';

export default function ScreeningPage() {
  const { tenant } = useTenant();
  const jobs = JOBS.filter((j) => j.tenantId === tenant.id);
  const [jobId, setJobId] = useState(jobs[0]?.id ?? '');
  const job = jobs.find((j) => j.id === jobId);

  const [list, setList] = useState<Candidate[]>([]);
  const [tab, setTab] = useState<'ranked' | 'errors'>('ranked');
  const [busy, setBusy] = useState(false);

  // Resetea la lista al cambiar de empresa o vacante (aislamiento por tenant)
  useEffect(() => {
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

  async function handleUpload() {
    if (!job) return;
    setBusy(true);
    const stamp = Math.floor(performance.now());
    const newFiles = [`Postulante_${stamp}.pdf`, `Aplicante_scan_${stamp}.pdf`];
    const mustHaves = job.filters.filter((f) => f.polarity === 'positive').map((f) => f.criterion);
    const negatives = job.filters.filter((f) => f.polarity === 'negative').map((f) => f.criterion);

    for (const file of newFiles) {
      const res = await providers.cvParser.parse(file);
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
      setList((prev) => [...prev, makeScoredCandidate(file, job, res.parsed!, score)]);
    }
    setBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Screening IA"
        subtitle="Carga masiva de CVs → parseo → scoring con evidencia. Una persona filtra cientos."
        actions={
          <Button onClick={handleUpload} disabled={busy || !job}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? 'Analizando…' : 'Cargar CVs'}
          </Button>
        }
      />

      {/* Contexto de la vacante + filtros */}
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vacante</span>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-500">
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
            <Card className="p-10 text-center text-sm text-slate-400">
              No hay candidatos puntuados. Pulsa <b>Cargar CVs</b> para ver el pipeline de IA en acción.
            </Card>
          )}
          {ranked.map((c, i) => (
            <CandidateRow key={c.id} rank={i + 1} candidate={c} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {errors.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400">Sin errores de lectura. 🎉</Card>
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
          <span className="text-lg font-black text-slate-300">#{rank}</span>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">
              {candidate.firstName} {candidate.lastName}
            </p>
            <Badge variant="slate">{candidate.source}</Badge>
            {candidate.flags?.map((f) => (
              <Badge key={f} variant="red">
                <AlertTriangle className="h-3 w-3" /> {f}
              </Badge>
            ))}
          </div>

          <p className="mt-1.5 text-sm text-slate-600">{candidate.justification}</p>

          {/* Evidencia anclada al CV (anti-alucinación) */}
          {candidate.evidence && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.evidence.map((e) => (
                <span
                  key={e.criterion}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                    e.matched ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
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
          <p className="mt-1 text-[11px] text-slate-400">match {candidate.matchPercent}%</p>
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
        <p className="text-sm font-semibold text-slate-800">{candidate.cvFileName}</p>
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
        active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

// ---- builders para candidatos generados en vivo ----
function makeScoredCandidate(
  file: string,
  job: Job,
  parsed: NonNullable<Candidate['parsed']>,
  score: { score: number; matchPercent: number; justification: string; evidence: Candidate['evidence']; flags: string[] },
): Candidate {
  return {
    id: crypto.randomUUID(),
    tenantId: job.tenantId,
    jobId: job.id,
    firstName: 'Nuevo',
    lastName: file.replace(/\.pdf$/i, '').slice(0, 12),
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
  return {
    id: crypto.randomUUID(),
    tenantId: job.tenantId,
    jobId: job.id,
    firstName: 'Sin',
    lastName: 'leer',
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
