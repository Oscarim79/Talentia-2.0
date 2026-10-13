import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Lightbulb,
  MessageSquareQuote,
  NotebookPen,
  Printer,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  ThumbsUp,
  XCircle,
  Undo2,
} from 'lucide-react';
import { useCandidates } from '../../context/CandidatesContext';
import { useJobs } from '../../context/JobsContext';
import { useEvaluations } from '../../context/EvaluationsContext';
import { useSettings } from '../../context/SettingsContext';
import { Badge, Button, Card, PageHeader } from '../../components/ui/primitives';
import { cn, downloadTextFile, slugify } from '../../lib/utils';
import {
  BEHAVIORAL,
  FOLLOW_UPS,
  GUIDES,
  INSTRUCTIONS,
  PLURAL_CAP,
  RECOMMENDATION_HINT,
  RECOMMENDATION_LABEL,
  SCALE,
  STORY,
  choiceQuestionsFor,
  competenciesFor,
  emptyEvaluation,
  fmt1,
  guideRoleForJob,
  isBlank,
  progressOf,
  scoreEvaluation,
  type ChoiceLetter,
  type CompetencyKey,
  type EvaluationResult,
  type GuideRole,
  type InterviewEvaluation,
  type RecommendationLevel,
} from '../../core/interviewGuide';
import { behavioralCell, blankGuideHtml, fmtDate, guideNote, indexFormula, printDocument, reportHtml, reportText, type ReportContext } from './reportExport';
import type { Candidate, CandidateStage, Job, User } from '../../types';

type Step = 'interview' | 'score' | 'report';

/** Cambio parcial de la evaluación; en forma de función se calcula sobre la versión más reciente. */
type Update = (patch: Partial<InterviewEvaluation> | ((prev: InterviewEvaluation) => Partial<InterviewEvaluation>)) => void;

const LEVEL_BADGE: Record<RecommendationLevel, 'green' | 'amber' | 'red'> = { recommended: 'green', reservations: 'amber', not: 'red' };

const STAGE_LABEL: Record<CandidateStage, string> = {
  applied: 'Aplicado',
  screening: 'Screening',
  interview: 'Entrevista',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Descartado',
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`;

export default function CompetencyInterviewPage() {
  const { candidates, setStage } = useCandidates();
  const { jobs } = useJobs();
  const { evaluations, saveEvaluation, updateEvaluation } = useEvaluations();
  const { hrTeam } = useSettings();
  const [params, setParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState('all');

  // A entrevistar: quien está en la etapa Entrevista; además, quien ya tiene evaluación (aunque haya avanzado o se haya descartado).
  const pool = useMemo(() => {
    const rank = (c: Candidate) => (evaluations[c.id]?.status === 'done' ? 2 : evaluations[c.id] ? 0 : 1);
    return candidates
      .filter((c) => c.stage === 'interview' || evaluations[c.id])
      .sort((a, b) => rank(a) - rank(b) || a.firstName.localeCompare(b.firstName));
  }, [candidates, evaluations]);

  const poolJobs = useMemo(() => jobs.filter((j) => pool.some((c) => c.jobId === j.id)), [jobs, pool]);
  const visible = jobFilter === 'all' ? pool : pool.filter((c) => c.jobId === jobFilter);
  const pending = visible.filter((c) => evaluations[c.id]?.status !== 'done');
  const finished = visible.filter((c) => evaluations[c.id]?.status === 'done');

  const requested = params.get('c');
  const selected = pool.find((c) => c.id === requested) ?? pending[0] ?? visible[0] ?? null;
  const select = (id: string) => setParams({ c: id }, { replace: true });

  const job = jobs.find((j) => j.id === selected?.jobId);

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Entrevista por competencias"
        subtitle="La guía de entrevista de RR.HH. para Vendedores y Jefes de Tienda: tomas notas durante la entrevista por Zoom, puntúas al terminar y la app calcula el reporte."
      />

      {pool.length === 0 ? (
        <Card className="p-10 text-center">
          <NotebookPen className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-3 text-sm font-semibold text-stone-700">Nadie en la etapa Entrevista todavía.</p>
          <p className="mt-1 text-sm text-stone-500">Quien confirma su entrevista en Respuestas a CVs aparece aquí para entrevistarlo con la guía.</p>
          <Link to="/respuestas" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Ir a Respuestas a CVs <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Lista de candidatos */}
          <div className="min-w-0">
            {/* Móvil: selector */}
            <label className="mb-3 block lg:hidden">
              <span className="mb-1 block text-xs font-semibold text-stone-500">Candidato</span>
              <select
                value={selected?.id ?? ''}
                onChange={(e) => select(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <optgroup label={`Por evaluar (${pending.length})`}>
                  {pending.map((c) => (
                    <option key={c.id} value={c.id}>
                      {fullName(c)} · {jobs.find((j) => j.id === c.jobId)?.title ?? ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Evaluadas (${finished.length})`}>
                  {finished.map((c) => (
                    <option key={c.id} value={c.id}>
                      {fullName(c)} · {jobs.find((j) => j.id === c.jobId)?.title ?? ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <Card className="hidden p-2 lg:block" dataTour="competencias:list">
              {poolJobs.length > 1 && (
                <select
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                  aria-label="Filtrar por vacante"
                  className="mb-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-600"
                >
                  <option value="all">Todas las vacantes</option>
                  {poolJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))}
                </select>
              )}
              <ListGroup title="Por evaluar" count={pending.length}>
                {pending.map((c) => (
                  <CandidateRow key={c.id} cand={c} job={jobs.find((j) => j.id === c.jobId)} ev={evaluations[c.id]} active={c.id === selected?.id} onClick={() => select(c.id)} />
                ))}
                {pending.length === 0 && <p className="px-2 py-3 text-xs text-stone-400">Nadie pendiente.</p>}
              </ListGroup>
              <ListGroup title="Evaluadas" count={finished.length}>
                {finished.map((c) => (
                  <CandidateRow key={c.id} cand={c} job={jobs.find((j) => j.id === c.jobId)} ev={evaluations[c.id]} active={c.id === selected?.id} onClick={() => select(c.id)} />
                ))}
                {finished.length === 0 && <p className="px-2 py-3 text-xs text-stone-400">Todavía ninguna.</p>}
              </ListGroup>
            </Card>
          </div>

          {/* Área de trabajo */}
          <div className="min-w-0">
            {selected ? (
              <Workspace
                key={selected.id}
                cand={selected}
                job={job}
                ev={evaluations[selected.id]}
                team={hrTeam}
                onSave={saveEvaluation}
                onUpdate={updateEvaluation}
                onStage={(stage) => setStage(selected.id, stage)}
              />
            ) : (
              <Card className="p-10 text-center text-sm text-stone-400">Elige un candidato de la lista.</Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ListGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="mb-1">
      <p className="flex items-center justify-between px-2 pb-1 pt-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400">
        {title} <span>{count}</span>
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function StatusChip({ ev }: { ev?: InterviewEvaluation }) {
  if (!ev) return <Badge variant="stone">Por entrevistar</Badge>;
  if (ev.status === 'draft') {
    const p = progressOf(ev);
    return <Badge variant="gold">{p.done ? `En curso · ${p.done}/${p.total} puntajes` : 'En curso'}</Badge>;
  }
  const r = scoreEvaluation(ev);
  if (r.index == null || !r.level) return <Badge variant="stone">Terminada</Badge>;
  return (
    <Badge variant={LEVEL_BADGE[r.level]}>
      {fmt1(r.index)} · {RECOMMENDATION_LABEL[r.level]}
    </Badge>
  );
}

function CandidateRow({ cand, job, ev, active, onClick }: { cand: Candidate; job?: Job; ev?: InterviewEvaluation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors',
        active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-stone-50',
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
        {cand.firstName[0]}
        {cand.lastName[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-800">{fullName(cand)}</p>
        <p className="truncate text-[11px] text-stone-500">
          {job?.title ?? 'Vacante'}
          {cand.stage !== 'interview' && ` · ${STAGE_LABEL[cand.stage]}`}
        </p>
        <div className="mt-1">
          <StatusChip ev={ev} />
        </div>
      </div>
    </button>
  );
}

// ============================================================
//  Área de trabajo de un candidato
// ============================================================

function Workspace({
  cand,
  job,
  ev,
  team,
  onSave,
  onUpdate,
  onStage,
}: {
  cand: Candidate;
  job?: Job;
  ev?: InterviewEvaluation;
  team: User[];
  onSave: (ev: InterviewEvaluation) => void;
  onUpdate: (candidateId: string, fn: (prev: InterviewEvaluation) => InterviewEvaluation) => void;
  onStage: (stage: CandidateStage) => void;
}) {
  const [step, setStep] = useState<Step>(() => (ev?.status === 'done' ? 'report' : 'interview'));
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, [step]);

  const suggestedRole = guideRoleForJob(job);
  const defaultInterviewer = team.find((u) => u.id === cand.ownerId)?.id ?? team[0]?.id ?? '';

  if (!ev) {
    return (
      <StartCard
        cand={cand}
        job={job}
        role={suggestedRole}
        onStart={() =>
          onSave(
            emptyEvaluation({ candidateId: cand.id, tenantId: cand.tenantId, jobId: cand.jobId, role: suggestedRole, interviewerId: defaultInterviewer, date: todayIso() }),
          )
        }
      />
    );
  }

  const update: Update = (patch) => onUpdate(ev.candidateId, (prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  const readOnly = ev.status === 'done';
  const result = scoreEvaluation(ev);
  const questions = BEHAVIORAL[ev.role];
  const notesTotal = questions.length + 1;
  const notesDone = [...questions.map((q) => q.id), 'story'].filter((id) => ev.notes[id]?.trim()).length;
  const choicesTotal = choiceQuestionsFor(ev.role).length;
  const choicesDone = choiceQuestionsFor(ev.role).filter((q) => ev.choices[q.id]).length;
  const interviewer = team.find((u) => u.id === ev.interviewerId);

  const steps: { id: Step; n: number; label: string; hint: string }[] = [
    { id: 'interview', n: 1, label: 'Entrevista', hint: `Notas ${notesDone}/${notesTotal} · opción múltiple ${choicesDone}/${choicesTotal}` },
    { id: 'score', n: 2, label: 'Puntuar', hint: `${result.total - result.missing}/${result.total} puntajes` },
    { id: 'report', n: 3, label: 'Reporte', hint: result.complete ? 'Listo' : `Faltan ${result.missing}` },
  ];

  return (
    <div className="space-y-4">
      {/* Encabezado del candidato */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {cand.firstName[0]}
            {cand.lastName[0]}
          </div>
          <div className="min-w-[12rem] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink">{fullName(cand)}</h2>
              <StatusChip ev={ev} />
            </div>
            <p className="text-sm text-stone-500">
              {job ? `${job.title} · ${job.brand}` : 'Vacante'} · etapa {STAGE_LABEL[cand.stage]}
              {cand.screeningScore != null && ` · score CV ${cand.screeningScore}`}
            </p>
          </div>
          <Button
            variant="secondary"
            className="w-full justify-center sm:w-auto"
            onClick={() => printDocument(`Guía de entrevista · ${GUIDES[ev.role].label}`, blankGuideHtml(ev.role))}
          >
            <Printer className="h-4 w-4" /> Imprimir guía
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Guía de entrevista">
            <select
              value={ev.role}
              disabled={readOnly || !isBlank(ev)}
              title={!isBlank(ev) ? 'Ya hay notas o puntajes: para cambiar de guía, borra la evaluación y empieza de nuevo.' : undefined}
              onChange={(e) => update({ role: e.target.value as GuideRole })}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm disabled:bg-stone-50 disabled:text-stone-600"
            >
              {(Object.keys(GUIDES) as GuideRole[]).map((r) => (
                <option key={r} value={r}>
                  {GUIDES[r].label} ({GUIDES[r].minutes} min)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Entrevistador">
            <select
              value={ev.interviewerId}
              disabled={readOnly}
              onChange={(e) => update({ interviewerId: e.target.value })}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm disabled:bg-stone-50 disabled:text-stone-600"
            >
              {!interviewer && <option value={ev.interviewerId}>—</option>}
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de la entrevista">
            <input
              type="date"
              value={ev.date}
              disabled={readOnly}
              onChange={(e) => e.target.value && update({ date: e.target.value })}
              className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm disabled:bg-stone-50 disabled:text-stone-600"
            />
          </Field>
        </div>
      </Card>

      {/* Pasos */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Pasos de la evaluación" data-tour="competencias:steps">
        {steps.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={step === s.id}
            onClick={() => setStep(s.id)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-left transition-colors',
              step === s.id ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-stone-200 bg-white text-stone-700 hover:border-brand-300',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', step === s.id ? 'bg-white/20' : 'bg-stone-100')}>{s.n}</span>
              {s.label}
            </span>
            <span className={cn('mt-0.5 block truncate text-[11px]', step === s.id ? 'text-brand-100' : 'text-stone-400')}>{s.hint}</span>
          </button>
        ))}
      </div>

      {readOnly && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <Lock className="h-4 w-4 shrink-0" />
          <span className="flex-1">Evaluación terminada: queda como registro y no se puede editar.</span>
          <Button variant="secondary" onClick={() => update({ status: 'draft' })}>
            <Unlock className="h-4 w-4" /> Reabrir para corregir
          </Button>
        </div>
      )}

      {step === 'interview' && <InterviewStep ev={ev} update={update} readOnly={readOnly} onNext={() => setStep('score')} />}
      {step === 'score' && <ScoreStep ev={ev} result={result} update={update} readOnly={readOnly} onBack={() => setStep('interview')} onNext={() => setStep('report')} />}
      {step === 'report' && (
        <ReportStep
          cand={cand}
          job={job}
          ev={ev}
          result={result}
          interviewerName={interviewer?.name ?? '—'}
          update={update}
          onStage={onStage}
          onEdit={() => setStep('score')}
        />
      )}

      {!readOnly && !isBlank(ev) && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (!window.confirm(`Se borrarán las notas y los puntajes de ${fullName(cand)}. ¿Empezar de nuevo?`)) return;
              onSave(emptyEvaluation({ candidateId: ev.candidateId, tenantId: ev.tenantId, jobId: ev.jobId, role: ev.role, interviewerId: ev.interviewerId, date: ev.date }));
              setStep('interview');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Borrar y empezar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}

function StartCard({ cand, job, role, onStart }: { cand: Candidate; job?: Job; role: GuideRole; onStart: () => void }) {
  const g = GUIDES[role];
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {cand.firstName[0]}
          {cand.lastName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">{fullName(cand)}</h2>
          <p className="text-sm text-stone-500">
            {job ? `${job.title} · ${job.brand}` : 'Vacante'} · etapa {STAGE_LABEL[cand.stage]}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <MiniStat value={g.label} label="Guía" />
        <MiniStat value={`${BEHAVIORAL[role].length}`} label="Conductuales (2 por competencia)" />
        <MiniStat value={`1 + ${choiceQuestionsFor(role).length}`} label="Historia + opción múltiple" />
        <MiniStat value={`${g.minutes} min`} label="Duración aproximada" />
      </div>
      <ol className="mt-5 space-y-2 text-sm text-stone-600">
        <li className="flex gap-2">
          <StepDot n={1} /> <span><b className="text-stone-800">Entrevista:</b> haces las preguntas en orden y anotas frases textuales del candidato.</span>
        </li>
        <li className="flex gap-2">
          <StepDot n={2} /> <span><b className="text-stone-800">Puntuar:</b> al terminar, das de 1 a 5 a cada respuesta con la escala de la guía.</span>
        </li>
        <li className="flex gap-2">
          <StepDot n={3} /> <span><b className="text-stone-800">Reporte:</b> la app calcula cada competencia, el Índice General y la recomendación.</span>
        </li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={onStart} dataTour="competencias:start">
          <NotebookPen className="h-4 w-4" /> Empezar la entrevista
        </Button>
        <Button variant="secondary" onClick={() => printDocument(`Guía de entrevista · ${g.label}`, blankGuideHtml(role))}>
          <Printer className="h-4 w-4" /> Imprimir guía en blanco
        </Button>
      </div>
    </Card>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
      <p className="font-display text-lg font-semibold text-ink">{value}</p>
      <p className="text-[11px] leading-tight text-stone-500">{label}</p>
    </div>
  );
}

function StepDot({ n }: { n: number }) {
  return <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">{n}</span>;
}

function SectionTitle({ n, title, subtitle }: { n?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-display text-base font-semibold text-ink">
        {n && <span className="mr-1.5 text-brand-600">{n}</span>}
        {title}
      </h3>
      {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
    </div>
  );
}

function NotesBox({ value, onChange, readOnly, placeholder }: { value: string; onChange: (v: string) => void; readOnly: boolean; placeholder?: string }) {
  return (
    <textarea
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder={placeholder ?? 'Frases textuales del candidato…'}
      className="mt-2 w-full resize-y rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 read-only:bg-stone-50"
    />
  );
}

// ============================================================
//  Paso 1 — Entrevista (durante): preguntas en orden + notas
// ============================================================

function InterviewStep({ ev, update, readOnly, onNext }: { ev: InterviewEvaluation; update: Update; readOnly: boolean; onNext: () => void }) {
  const questions = BEHAVIORAL[ev.role];
  const setNote = (id: string, v: string) => update((p) => ({ notes: { ...p.notes, [id]: v } }));
  const setChoice = (id: string, l: ChoiceLetter) =>
    update((p) => {
      const choices = { ...p.choices };
      if (choices[id] === l) delete choices[id];
      else choices[id] = l;
      return { choices };
    });
  const storyText = ev.storyVariant === 'alternate' ? STORY.alternate : STORY.main;

  return (
    <div className="space-y-4">
      <details className="group rounded-2xl border border-gold-200 bg-gold-100/40 p-4" open={isBlank(ev)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-stone-800">
          <BookOpen className="h-4 w-4 text-gold-700" /> Cómo aplicar la entrevista
          <span className="ml-auto text-xs font-medium text-stone-500 group-open:hidden">Ver</span>
        </summary>
        <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
          {INSTRUCTIONS.map((i) => (
            <li key={i.title}>
              <b>{i.title}:</b> {i.text}
            </li>
          ))}
        </ul>
      </details>

      {/* Repreguntas siempre a la vista */}
      <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
          <MessageSquareQuote className="h-3.5 w-3.5 text-brand-600" />
          <span className="font-semibold text-stone-700">Repreguntas neutrales:</span>
          {FOLLOW_UPS.map((f) => (
            <span key={f} className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-800">
              {f}
            </span>
          ))}
        </p>
      </div>

      <Card className="p-4 sm:p-5">
        <SectionTitle n="1." title={`Preguntas conductuales (${questions.length})`} subtitle="Dos por competencia. Pide un ejemplo real: la situación, lo que hizo y el resultado." />
        <div className="space-y-5">
          {competenciesFor(ev.role).map((c) => (
            <div key={c.key}>
              <p className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-brand-600">{c.label}</p>
              <div className="space-y-3">
                {questions
                  .filter((q) => q.competency === c.key)
                  .map((q) => (
                    <div key={q.id} className="rounded-xl border border-stone-100 p-3">
                      <p className="text-[15px] font-semibold leading-snug text-stone-900">
                        <span className="mr-1.5 text-xs font-bold text-stone-400">{q.id}</span>
                        {q.text}
                      </p>
                      <p className="mt-1 flex gap-1.5 text-xs text-stone-500">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                        <span>
                          <b>Busca:</b> {q.lookFor}
                        </span>
                      </p>
                      <NotesBox value={ev.notes[q.id] ?? ''} onChange={(v) => setNote(q.id, v)} readOnly={readOnly} />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle n="2." title="Pregunta basada en una historia" subtitle={STORY.howTo} />
        <div className="mb-3 inline-flex rounded-lg bg-stone-100 p-1" role="radiogroup" aria-label="Pregunta de la historia">
          {(['main', 'alternate'] as const).map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={ev.storyVariant === v}
              disabled={readOnly}
              onClick={() => update({ storyVariant: v })}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                ev.storyVariant === v ? 'bg-white text-brand-800 shadow-sm' : 'text-stone-500 hover:text-stone-800',
              )}
            >
              {v === 'main' ? 'Pregunta principal' : 'Pregunta alterna'}
            </button>
          ))}
        </div>
        <p className="text-[15px] font-semibold leading-snug text-stone-900">"{storyText}"</p>
        {ev.storyVariant === 'main' ? (
          <p className="mt-1 text-xs text-stone-500">Si no tiene un ejemplo, usa la pregunta alterna.</p>
        ) : (
          <p className="mt-1 text-xs text-stone-500">{STORY.alternateWhen}</p>
        )}
        <NotesBox value={ev.notes.story ?? ''} onChange={(v) => setNote('story', v)} readOnly={readOnly} placeholder="Qué buscaba el cliente, qué hizo el candidato, cómo terminó…" />
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionTitle
          n="3."
          title={`Opción múltiple (${choiceQuestionsFor(ev.role).length})`}
          subtitle="Pide al candidato que elija la opción que más se parece a lo que haría en la realidad. Marca la que eligió: los puntajes no se muestran."
        />
        <div className="space-y-4">
          {choiceQuestionsFor(ev.role).map((q) => (
            <div key={q.id}>
              <p className="text-sm font-semibold text-stone-900">
                <span className="mr-1.5 text-xs font-bold text-stone-400">{q.n}.</span>
                {q.prompt}
              </p>
              <div className="mt-2 space-y-1.5" role="radiogroup" aria-label={`Pregunta ${q.n}`}>
                {q.options.map((o) => {
                  const on = ev.choices[q.id] === o.letter;
                  return (
                    <button
                      key={o.letter}
                      role="radio"
                      aria-checked={on}
                      disabled={readOnly}
                      onClick={() => setChoice(q.id, o.letter)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default',
                        on ? 'border-brand-500 bg-brand-50 text-stone-900' : 'border-stone-200 text-stone-700 hover:border-brand-300',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                          on ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 text-stone-500',
                        )}
                      >
                        {o.letter}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Terminé la entrevista: puntuar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
//  Paso 2 — Puntuar (al terminar)
// ============================================================

function ScoreButtons({
  value,
  onChange,
  max = 5,
  disabled,
  label,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  max?: number;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={label}>
      {SCALE.map((s) => {
        const on = value === s.score;
        const blocked = s.score > max;
        return (
          <button
            key={s.score}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${s.score} · ${s.level}`}
            title={`${s.score} · ${s.level}: ${s.description}`}
            disabled={disabled || blocked}
            onClick={() => onChange(on ? undefined : s.score)}
            className={cn(
              'h-9 w-9 rounded-lg border text-sm font-bold transition-colors disabled:cursor-not-allowed',
              on ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-brand-400 hover:text-brand-700',
              blocked && 'opacity-30',
              disabled && !on && 'hover:border-stone-300 hover:text-stone-600',
            )}
          >
            {s.score}
          </button>
        );
      })}
      <span className="ml-1 text-xs font-medium text-stone-500">{value != null ? SCALE[value - 1].level : 'Sin puntaje'}</span>
    </div>
  );
}

function Quote({ text }: { text?: string }) {
  return text?.trim() ? (
    <p className="mt-1.5 whitespace-pre-line rounded-lg border-l-2 border-brand-300 bg-stone-50 px-3 py-1.5 text-sm italic text-stone-700">{text}</p>
  ) : (
    <p className="mt-1.5 text-xs text-stone-400">Sin notas.</p>
  );
}

function ScoreChip({ score, weight }: { score: number | null; weight: number }) {
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="text-[11px] text-stone-400">peso {Math.round(weight * 100)} %</span>
      <span
        className={cn(
          'rounded-lg px-2.5 py-1 font-display text-base font-semibold',
          score == null ? 'bg-stone-100 text-stone-400' : score >= 4 ? 'bg-green-100 text-green-800' : score >= 3 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700',
        )}
      >
        {score != null ? fmt1(score) : '—'}
      </span>
    </span>
  );
}

function ScoreStep({
  ev,
  result,
  update,
  readOnly,
  onBack,
  onNext,
}: {
  ev: InterviewEvaluation;
  result: EvaluationResult;
  update: Update;
  readOnly: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const questions = BEHAVIORAL[ev.role];

  const setBehavioral = (id: string, v: number | undefined) =>
    update((p) => {
      const behavioral = { ...p.behavioral };
      if (v == null) delete behavioral[id];
      else behavioral[id] = p.pluralOnly[id] ? Math.min(v, PLURAL_CAP) : v;
      return { behavioral };
    });
  const setPlural = (id: string, on: boolean) =>
    update((p) => {
      const behavioral = { ...p.behavioral };
      if (on && behavioral[id] != null) behavioral[id] = Math.min(behavioral[id], PLURAL_CAP);
      return { pluralOnly: { ...p.pluralOnly, [id]: on }, behavioral };
    });
  const setStory = (key: CompetencyKey, v: number | undefined) =>
    update((p) => {
      const story = { ...p.story };
      if (v == null) delete story[key];
      else story[key] = v;
      return { story };
    });

  return (
    <div className="space-y-4">
      <details className="rounded-2xl border border-stone-200 bg-white p-4" open>
        <summary className="cursor-pointer list-none text-sm font-bold text-stone-800">Escala de 1 a 5 · puntúa con la descripción, no con tu impresión general</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {SCALE.map((s) => (
            <div key={s.score} className="rounded-lg bg-stone-50 p-2.5">
              <p className="text-sm font-bold text-stone-800">
                {s.score} · {s.level}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{s.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Si el candidato habló solo en plural ("hicimos", "logramos") y no describió acciones propias, marca la casilla: el puntaje máximo es {PLURAL_CAP}.
        </p>
      </details>

      {/* Historia: un solo relato, cuatro criterios */}
      <Card className="p-4 sm:p-5">
        <SectionTitle title="Historia · aporta a cuatro competencias" subtitle={`"${ev.storyVariant === 'alternate' ? STORY.alternate : STORY.main}"`} />
        <Quote text={ev.notes.story} />
        <div className="mt-3 space-y-3">
          {STORY.criteria.map((c) => {
            const text = c.competency === 'resultados' && ev.storyVariant === 'alternate' ? STORY.alternateResults : c.text;
            const label = result.competencies.find((x) => x.key === c.competency)?.label ?? '';
            return (
              <div key={c.competency} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 p-3">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-xs font-bold text-brand-700">{label}</p>
                  <p className="text-sm text-stone-700">{text}</p>
                </div>
                <ScoreButtons value={ev.story[c.competency]} onChange={(v) => setStory(c.competency, v)} disabled={readOnly} label={`Historia · ${label}`} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Por competencia */}
      {result.competencies.map((c) => {
        const qs = questions.filter((q) => q.competency === c.key);
        return (
          <Card key={c.key} className="p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">{c.label}</h3>
              <ScoreChip score={c.score} weight={c.weight} />
            </div>
            <div className="space-y-3">
              {qs.map((q) => (
                <div key={q.id} className="rounded-xl border border-stone-100 p-3">
                  <p className="text-sm font-semibold text-stone-900">
                    <span className="mr-1.5 text-xs font-bold text-stone-400">{q.id}</span>
                    {q.text}
                  </p>
                  <Quote text={ev.notes[q.id]} />
                  <p className="mt-1.5 flex gap-1.5 text-xs text-stone-500">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                    <span>
                      <b>Para 4 o 5 busca:</b> {q.lookFor}
                    </span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <ScoreButtons
                      value={ev.behavioral[q.id]}
                      onChange={(v) => setBehavioral(q.id, v)}
                      max={ev.pluralOnly[q.id] ? PLURAL_CAP : 5}
                      disabled={readOnly}
                      label={`Puntaje ${q.id}`}
                    />
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input
                        type="checkbox"
                        checked={!!ev.pluralOnly[q.id]}
                        disabled={readOnly}
                        onChange={(e) => setPlural(q.id, e.target.checked)}
                        className="h-4 w-4 rounded border-stone-300 accent-brand-600"
                      />
                      Habló solo en plural (máx. {PLURAL_CAP})
                    </label>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                {c.storyApplies && (
                  <span>
                    Historia: <b>{c.story ?? '—'}</b>
                  </span>
                )}
                <span>
                  Opción múltiple:{' '}
                  {c.choiceLetter ? (
                    <>
                      eligió <b>{c.choiceLetter}</b> → <b>{c.choice}</b> puntos
                    </>
                  ) : (
                    <span className="text-amber-700">sin respuesta (márcala en el paso 1)</span>
                  )}
                </span>
                {c.behavioralAvg != null && (
                  <span>
                    Promedio conductual: <b>{c.behavioralAvg.toFixed(2)}</b>
                  </span>
                )}
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-stone-500">Observaciones de la competencia (van al reporte)</span>
                <NotesBox
                  value={ev.observations[c.key] ?? ''}
                  onChange={(v) => update((p) => ({ observations: { ...p.observations, [c.key]: v } }))}
                  readOnly={readOnly}
                  placeholder="Ej. Escucha antes de ofrecer y da seguimiento al cliente."
                />
              </label>
            </div>
          </Card>
        );
      })}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Volver a las notas
        </Button>
        <Button onClick={onNext}>
          Ver el reporte <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
//  Paso 3 — Reporte de competencias + decisión de RR.HH.
// ============================================================

function ReportStep({
  cand,
  job,
  ev,
  result: r,
  interviewerName,
  update,
  onStage,
  onEdit,
}: {
  cand: Candidate;
  job?: Job;
  ev: InterviewEvaluation;
  result: EvaluationResult;
  interviewerName: string;
  update: Update;
  onStage: (stage: CandidateStage) => void;
  onEdit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [printBlocked, setPrintBlocked] = useState(false);
  const asSeller = ev.role === 'jefe' && r.complete ? scoreEvaluation(ev, 'vendedor') : null;
  const ctx: ReportContext = { ev, result: r, asSeller, candidateName: fullName(cand), jobTitle: job?.title ?? GUIDES[ev.role].label, interviewerName };
  const fileBase = `reporte-competencias-${slugify(fullName(cand))}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText(ctx));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* portapapeles bloqueado: queda la descarga */
    }
  }

  function decide(stage: CandidateStage) {
    if (ev.status !== 'done') update({ status: 'done' });
    onStage(stage);
  }

  return (
    <div className="space-y-4">
      {!r.complete && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="flex-1">
            Faltan <b>{r.missing}</b> de {r.total} puntajes para calcular el Índice General y la recomendación.
          </span>
          <Button variant="secondary" onClick={onEdit}>
            Ir a puntuar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card className="p-4 sm:p-6" dataTour="competencias:report">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-brand-600">Reporte de competencias del candidato</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink">{fullName(cand)}</h3>
          </div>
          <FileText className="h-6 w-6 text-stone-300" />
        </div>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Meta label="Puesto aplicado" value={guideNote(ctx.jobTitle, ev.role)} />
          <Meta label="Fecha de la entrevista" value={fmtDate(ev.date)} />
          <Meta label="Entrevistador" value={interviewerName} />
          <Meta label="Etapa actual" value={STAGE_LABEL[cand.stage]} />
        </dl>

        {/* Tabla */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400">
                <th className="py-2 pr-3 font-semibold">Competencia</th>
                <th className="px-2 py-2 text-center font-semibold">Conductuales</th>
                <th className="px-2 py-2 text-center font-semibold">Historia</th>
                <th className="px-2 py-2 text-center font-semibold">Opción múltiple</th>
                <th className="px-2 py-2 text-center font-semibold">Peso</th>
                <th className="py-2 pl-2 text-right font-semibold">Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {r.competencies.map((c) => (
                <tr key={c.key} className="border-b border-stone-100">
                  <td className="py-2 pr-3 font-medium text-stone-800">{c.label}</td>
                  <td className="px-2 py-2 text-center text-stone-600">{behavioralCell(c)}</td>
                  <td className="px-2 py-2 text-center text-stone-600">{c.storyApplies ? (c.story ?? '—') : <span className="text-stone-400">No aplica</span>}</td>
                  <td className="px-2 py-2 text-center text-stone-600">{c.choice ?? '—'}</td>
                  <td className="px-2 py-2 text-center text-stone-400">{Math.round(c.weight * 100)} %</td>
                  <td className="py-2 pl-2 text-right">
                    <span
                      className={cn(
                        'font-display text-base font-semibold',
                        c.score == null ? 'text-stone-300' : c.score >= 4 ? 'text-green-700' : c.score >= 3 ? 'text-amber-700' : 'text-red-600',
                      )}
                    >
                      {c.score != null ? fmt1(c.score) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          Puntaje de la competencia = (promedio conductual × 0.8) + (opción múltiple × 0.2). El promedio conductual incluye el criterio de la historia cuando aplica.
        </p>

        {/* Índice y recomendación */}
        {r.index != null && r.level && (
          <div className="mt-5 grid gap-4 rounded-2xl bg-stone-50 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="text-center sm:pr-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Índice General</p>
              <p className="font-display text-4xl font-semibold leading-none text-ink">{fmt1(r.index)}</p>
              <p className="mt-1 text-xs text-stone-500">de 5 · {r.percent} %</p>
            </div>
            <div className="min-w-0">
              <Badge variant={LEVEL_BADGE[r.level]} className="px-3 py-1 text-sm">
                {RECOMMENDATION_LABEL[r.level]}
              </Badge>
              <p className="mt-1.5 text-sm text-stone-700">{RECOMMENDATION_HINT[r.level]}</p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-stone-500">
                {r.reasons.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
              <p className="mt-1.5 break-words font-mono text-[10.5px] text-stone-400">{indexFormula(r)}</p>
            </div>
          </div>
        )}

        {asSeller?.index != null && asSeller.level && (
          <p className="mt-3 rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-600">
            <b className="text-stone-800">Leído como Vendedor</b> (mismos puntajes, pesos de Vendedor): Índice {fmt1(asSeller.index)} ({asSeller.percent} %) —{' '}
            <Badge variant={LEVEL_BADGE[asSeller.level]}>{RECOMMENDATION_LABEL[asSeller.level]}</Badge>
            <span className="mt-0.5 block text-xs text-stone-400">Útil si el candidato no queda para Jefe de Tienda pero podría servir en piso de ventas.</span>
          </p>
        )}

        {/* Resumen */}
        {(r.strengths.length > 0 || r.improvements.length > 0) && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SummaryList title="Fortalezas" items={r.strengths.map((c) => `${c.label} (${fmt1(c.score!)})`)} tone="text-green-700" />
            <SummaryList title="Áreas de mejora" items={r.improvements.map((c) => `${c.label} (${fmt1(c.score!)})`)} tone="text-amber-700" />
          </div>
        )}

        {r.competencies.some((c) => ev.observations[c.key]?.trim()) && (
          <div className="mt-5">
            <p className="mb-1.5 text-sm font-bold text-stone-800">Observaciones por competencia</p>
            <ul className="space-y-1 text-sm text-stone-700">
              {r.competencies
                .filter((c) => ev.observations[c.key]?.trim())
                .map((c) => (
                  <li key={c.key}>
                    <b>{c.label}:</b> {ev.observations[c.key]}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Acciones del reporte */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
          {ev.status === 'draft' && (
            <Button onClick={() => update({ status: 'done' })} disabled={!r.complete}>
              <ClipboardCheck className="h-4 w-4" /> Terminar evaluación
            </Button>
          )}
          <Button variant="secondary" onClick={() => setPrintBlocked(!printDocument(`Reporte de competencias · ${fullName(cand)}`, reportHtml(ctx)))}>
            <Printer className="h-4 w-4" /> Imprimir o guardar PDF
          </Button>
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </Button>
          <Button variant="secondary" onClick={() => downloadTextFile(`${fileBase}.txt`, reportText(ctx))}>
            <Download className="h-4 w-4" /> Descargar .txt
          </Button>
        </div>
        {printBlocked && <p className="mt-2 text-xs text-amber-700">El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio o usa "Descargar .txt".</p>}
      </Card>

      {/* Decisión de RR.HH. */}
      {r.complete && (
        <Card className="p-4 sm:p-5">
          <p className="text-sm font-bold text-stone-800">Decisión de RR.HH.</p>
          <p className="mt-0.5 text-sm text-stone-500">La recomendación apoya la decisión; la decisión es tuya. El candidato se mueve de etapa en Candidatos.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {cand.stage === 'interview' ? (
              <>
                <Button onClick={() => decide('offer')}>
                  <ThumbsUp className="h-4 w-4" /> Pasar a Oferta
                </Button>
                <Button variant="secondary" onClick={() => decide('rejected')}>
                  <XCircle className="h-4 w-4" /> Descartar
                </Button>
              </>
            ) : (
              <>
                <Badge variant={cand.stage === 'rejected' ? 'red' : 'green'}>Etapa actual: {STAGE_LABEL[cand.stage]}</Badge>
                {(cand.stage === 'offer' || cand.stage === 'rejected') && (
                  <Button variant="ghost" onClick={() => onStage('interview')}>
                    <Undo2 className="h-4 w-4" /> Regresar a Entrevista
                  </Button>
                )}
              </>
            )}
            <Link to="/candidatos" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Ver en Candidatos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-stone-400">{label}:</dt>
      <dd className="min-w-0 font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function SummaryList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-xl border border-stone-100 p-3">
      <p className={cn('text-sm font-bold', tone)}>{title}</p>
      {items.length ? (
        <ul className="mt-1 space-y-0.5 text-sm text-stone-700">
          {items.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-stone-400">—</p>
      )}
    </div>
  );
}
