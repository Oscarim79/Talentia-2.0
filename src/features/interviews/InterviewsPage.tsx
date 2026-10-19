import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Video,
  AlertTriangle,
  Bot,
  User,
  Send,
  RotateCcw,
  Sparkles,
  Compass,
  NotebookPen,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { useCandidates } from '../../context/CandidatesContext';
import { useEvaluations } from '../../context/EvaluationsContext';
import { useSettings } from '../../context/SettingsContext';
import { providers } from '../../core/providers';
import {
  GUIDES,
  SCALE,
  competencyLabel,
  emptyEvaluation,
  guideRoleForJob,
  interviewScript,
  CHOICE_QUESTIONS,
  type ChoiceLetter,
  type InterviewScriptItem,
} from '../../core/interviewGuide';
import { useHelp } from '../help/HelpContext';
import type { Candidate, InterviewTurn, Discrepancy } from '../../types';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';

// Americana 2000 entrevista por videollamada (cadena en todo el país): es el canal principal.
const CHANNELS = [
  { icon: Video, label: 'Videollamada', desc: 'El asistente de IA entra a la videollamada de Zoom, graba y transcribe (Recall.ai)', tag: 'Fase 3' },
  { icon: MessageCircle, label: 'WhatsApp', desc: 'Entrevista por texto + agendamiento', tag: 'Fase 2' },
  { icon: Phone, label: 'Teléfono', desc: 'Agente de voz (Vapi/Retell)', tag: 'Fase 3' },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function InterviewsPage() {
  const { tenant } = useTenant();
  const { jobs } = useJobs();
  const { openModuleIntro } = useHelp();
  const { candidates: tenantCands, setStage } = useCandidates();
  const { evaluations, saveEvaluation } = useEvaluations();
  const { hrTeam } = useSettings();
  const navigate = useNavigate();

  // Candidatos entrevistables del tenant (ya puntuados en screening; incluye los CVs cargados
  // y a quienes confirmaron su entrevista en Respuestas a CVs).
  const candidates = useMemo(
    () => tenantCands.filter((c) => c.screeningStatus === 'scored' && (c.stage === 'interview' || c.stage === 'screening')),
    [tenantCands],
  );

  const [candId, setCandId] = useState('');
  // Por defecto, el primero en etapa de entrevista (o el primero disponible).
  useEffect(() => {
    const preferred = candidates.find((c) => c.stage === 'interview') ?? candidates[0];
    setCandId(preferred?.id ?? '');
  }, [candidates]);

  const cand = candidates.find((c) => c.id === candId);
  const job = jobs.find((j) => j.id === cand?.jobId);
  // El asistente sigue la guía de competencias de RR.HH. que aplica a la vacante (Vendedor o Jefe de Tienda).
  const role = guideRoleForJob(job);
  const guide = GUIDES[role];
  const script = useMemo(() => interviewScript(role), [role]);

  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState<'draft' | 'kept' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Generación de la conversación: invalida respuestas pendientes del agente
  // cuando se cambia de candidato/empresa (evita mensajes "fantasma").
  const genRef = useRef(0);

  // Reinicia la conversación al cambiar de candidato o empresa.
  useEffect(() => {
    genRef.current += 1;
    setTurns([]);
    setInput('');
    setThinking(false);
    setDone(false);
    setSaved(null);
  }, [candId, tenant.id]);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, thinking]);

  const started = turns.length > 0;

  // Pide al agente (puerto LLM) su siguiente turno a partir del historial.
  async function agentSpeak(history: InterviewTurn[]) {
    if (!cand) return;
    const gen = genRef.current;
    setThinking(true);
    const res = await providers.llm.interviewReply({
      history,
      jobTitle: job?.title ?? '',
      candidateName: `${cand.firstName} ${cand.lastName}`,
      guideLabel: guide.label,
      script,
    });
    // Si la conversación cambió mientras el agente "pensaba", descarta la respuesta.
    if (gen !== genRef.current) return;
    setThinking(false);
    setTurns((prev) => [...prev, { role: 'agent', content: res.message, questionId: res.questionId, followUp: res.followUp }]);
    if (res.done) setDone(true);
  }

  function startInterview() {
    setTurns([]);
    setDone(false);
    setSaved(null);
    agentSpeak([]);
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking || done) return;
    const next: InterviewTurn[] = [...turns, { role: 'candidate', content: text }];
    setTurns(next);
    setInput('');
    await agentSpeak(next);
  }

  const transcript = useMemo(() => (done ? transcriptOf(turns, script) : null), [done, turns, script]);
  const evaluation = done && cand && transcript ? evaluate(transcript, script, cand) : null;

  // Al terminar, la transcripción queda como borrador en Entrevistas (competencias) para que RR.HH. puntúe.
  // Si ese candidato ya tiene una evaluación terminada, no se toca.
  useEffect(() => {
    if (!done || !cand || !transcript) return;
    const existing = evaluations[cand.id];
    if (existing?.status === 'done') {
      setSaved('kept');
      return;
    }
    const interviewerId = hrTeam.find((u) => u.id === cand.ownerId)?.id ?? hrTeam[0]?.id ?? '';
    saveEvaluation({
      ...emptyEvaluation({ candidateId: cand.id, tenantId: cand.tenantId, jobId: cand.jobId, role, interviewerId, date: todayIso() }),
      notes: transcript.notes,
      choices: transcript.choices,
      source: 'ai',
    });
    if (cand.stage === 'screening') setStage(cand.id, 'interview');
    setSaved('draft');
    // Solo al terminar la entrevista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Entrevistas IA"
        subtitle="El asistente de IA entrevista por videollamada (Zoom) con la guía de competencias de RR.HH. (Vendedor o Jefe de Tienda), transcribe y deja las respuestas listas para puntuar. RR.HH. decide."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">
              <Sparkles className="h-3 w-3" /> Videollamada simulada con chat · demo
            </Badge>
            <Button variant="secondary" onClick={() => openModuleIntro('interviewsAi')}>
              <Compass className="h-4 w-4" /> Cómo funciona
            </Button>
          </div>
        }
      />

      {/* Canales (Fases 2–3) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3" data-tour="interviews:channels">
        {CHANNELS.map((ch) => (
          <Card key={ch.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">
                <ch.icon className="h-5 w-5" />
              </div>
              <Badge variant="stone">{ch.tag}</Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-stone-800">{ch.label}</p>
            <p className="text-xs text-stone-500">{ch.desc}</p>
          </Card>
        ))}
      </div>

      {/* Selector de candidato */}
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Candidato</span>
            <select
              value={candId}
              onChange={(e) => setCandId(e.target.value)}
              disabled={candidates.length === 0}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-stone-50"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — score {c.screeningScore}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {job && <Badge variant="stone">{job.title}</Badge>}
            {cand && (
              <Badge variant="blue" title="Guía de entrevista por competencias de RR.HH. que aplica a la vacante">
                <NotebookPen className="h-3 w-3" /> Guía: {guide.label} · {script.length} preguntas
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {candidates.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-400">
          No hay candidatos en etapa de entrevista para esta empresa. Puntúa CVs en <b>Screening IA</b> primero.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chat interactivo */}
          <Card className="flex flex-col lg:col-span-2" dataTour="interviews:chat">
            <div className="flex items-center justify-between border-b border-stone-100 p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-stone-700">
                <Bot className="h-4 w-4 text-brand-600" /> Entrevista — {cand?.firstName} {cand?.lastName}
              </h2>
              {started && (
                <Button variant="ghost" onClick={startInterview} disabled={thinking}>
                  <RotateCcw className="h-4 w-4" /> Reiniciar
                </Button>
              )}
            </div>

            <div ref={scrollRef} className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-4">
              {!started && !thinking && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Bot className="h-10 w-10 text-brand-300" />
                  <p className="max-w-sm text-sm text-stone-500">
                    El asistente de IA hará las {script.length} preguntas de la guía de {guide.label} ({guide.minutes} min): conductuales, la historia y opción múltiple, en el orden de la guía. En la demo la videollamada se simula con este chat: responde como lo haría el candidato.
                  </p>
                  <Button onClick={startInterview} disabled={thinking} dataTour="interviews:start">
                    <Sparkles className="h-4 w-4" /> Iniciar entrevista
                  </Button>
                </div>
              )}

              {turns.map((t, i) => (
                <Bubble key={i} turn={t} />
              ))}
              {thinking && <TypingBubble />}
            </div>

            {started && !done && (
              <div className="flex items-center gap-2 border-t border-stone-100 p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send();
                  }}
                  placeholder="Escribe la respuesta del candidato…"
                  disabled={thinking}
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-stone-50"
                />
                <Button onClick={send} disabled={thinking || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {done && (
              <div className="border-t border-stone-100 p-3 text-center text-xs text-stone-400">
                Entrevista finalizada · {evaluation?.answersCount} respuestas registradas
              </div>
            )}
          </Card>

          {/* Panel de evaluación (aparece al finalizar) */}
          <div className="space-y-4" data-tour="interviews:evaluation">
            {!evaluation || !cand ? (
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-bold text-stone-700">Al terminar</h3>
                <p className="text-sm text-stone-500">
                  La transcripción queda guardada como borrador en Entrevistas (cada respuesta bajo su pregunta y las opciones múltiples marcadas), con una sugerencia preliminar de puntaje y las discrepancias CV vs respuestas. El puntaje lo das tú en Entrevistas.
                </p>
              </Card>
            ) : (
              <>
                <Card className="p-5" dataTour="interviews:saved">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-700">
                    <NotebookPen className="h-4 w-4 text-brand-600" /> Transcripción en Entrevistas
                  </h3>
                  {saved === 'kept' ? (
                    <p className="text-sm text-stone-500">
                      {cand.firstName} ya tiene una evaluación terminada en Entrevistas; esta entrevista de prueba no la cambia.
                    </p>
                  ) : (
                    <p className="text-sm text-stone-500">
                      Guardada como borrador: {evaluation.notesCount} de {evaluation.notesTotal} respuestas anotadas y {evaluation.choicesCount} de {evaluation.choicesTotal} opciones múltiples marcadas. Ahí puntúas de 1 a 5 cada respuesta y la app calcula el Índice General y la recomendación.
                    </p>
                  )}
                  <Button className="mt-3" onClick={() => navigate(`/competencias?c=${cand.id}`)}>
                    Puntuar en Entrevistas <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>

                <Card className="p-5">
                  <h3 className="mb-1 text-sm font-bold text-stone-700">Sugerencia preliminar de la IA</h3>
                  <p className="mb-3 text-xs text-stone-400">
                    Orientativa, de 1 a 5 según la escala de la guía: sube con ejemplos concretos, acciones propias y resultados medibles; baja si solo habla en plural. La puntuación válida la da RR.HH.
                  </p>
                  <div className="space-y-2.5">
                    {evaluation.perQuestion.map((q) => (
                      <div key={q.id} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-stone-600">
                          <b className="text-stone-700">{q.id}</b> · {q.competency}
                          {q.pluralOnly && <span className="ml-1 text-amber-700">· solo en plural</span>}
                        </span>
                        <Badge variant={q.score >= 4 ? 'green' : q.score >= 3 ? 'amber' : 'red'}>{q.score}/5</Badge>
                      </div>
                    ))}
                    {evaluation.choices.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-stone-600">
                          <b className="text-stone-700">{c.id}</b> · {c.competency} · opción {c.letter ?? '—'}
                        </span>
                        {c.points == null ? (
                          <Badge variant="stone">sin elegir</Badge>
                        ) : (
                          <Badge variant={c.points === 5 ? 'green' : c.points === 3 ? 'amber' : 'red'}>{c.points}/5</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Discrepancias CV vs respuestas
                  </h3>
                  {evaluation.discrepancies.length === 0 ? (
                    <p className="text-xs text-stone-500">Sin discrepancias detectadas entre el CV y las respuestas.</p>
                  ) : (
                    <div className="space-y-3">
                      {evaluation.discrepancies.map((d, i) => (
                        <div key={i} className="rounded-lg bg-amber-50 p-3 text-xs">
                          <p className="font-bold text-amber-800">{d.topic}</p>
                          <p className="mt-1 text-stone-600">{d.cvClaim}</p>
                          <p className="text-stone-600">{d.interviewClaim}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                {saved === 'draft' && (
                  <p className="flex items-center gap-1.5 text-[11px] text-stone-400">
                    <Check className="h-3 w-3 text-green-600" /> El candidato está en la etapa Entrevista y aparece en Entrevistas y en Candidatos.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponentes de chat ----------

function Bubble({ turn }: { turn: InterviewTurn }) {
  const isAgent = turn.role === 'agent';
  return (
    <div className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isAgent ? 'bg-brand-100 text-brand-600' : 'bg-green-100 text-green-600'
        }`}
      >
        {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${
          isAgent ? 'bg-stone-100 text-stone-700' : 'bg-green-50 text-stone-800'
        }`}
      >
        {renderRich(turn.content)}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-stone-100 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
      </div>
    </div>
  );
}

/** Renderiza negritas simples **así** en los mensajes del agente. */
function renderRich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**') ? (
      <strong key={i}>{seg.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{seg}</span>
    ),
  );
}

// ---------- Transcripción por pregunta ----------

interface Transcript {
  /** Respuestas textuales por pregunta conductual y de la historia (mismos ids que la evaluación). */
  notes: Record<string, string>;
  /** Letra elegida en cada pregunta de opción múltiple. */
  choices: Record<string, ChoiceLetter>;
  answersCount: number;
}

/** Interpreta la respuesta a una opción múltiple: la letra ("B", "b)", "la B") o el texto de la opción. */
function parseChoice(text: string, item: InterviewScriptItem): ChoiceLetter | null {
  const t = text.trim();
  const m = t.match(/^\(?\s*(?:la\s+|opci[oó]n\s+)?([abc])\s*[).:-]?(?:\s|$)/i) ?? t.match(/\b(?:la|opci[oó]n)\s+([abc])\b/i);
  if (m) return m[1].toUpperCase() as ChoiceLetter;
  const lower = t.toLowerCase();
  const hit = item.options?.find((o) => lower.includes(o.text.toLowerCase().slice(0, 25)));
  return hit?.letter ?? null;
}

/** Reparte los turnos del candidato bajo la pregunta del guion que el agente estaba haciendo (las repreguntas no cambian de pregunta). */
function transcriptOf(turns: InterviewTurn[], script: InterviewScriptItem[]): Transcript {
  const notes: Record<string, string> = {};
  const choices: Record<string, ChoiceLetter> = {};
  let current: InterviewScriptItem | undefined;
  let answersCount = 0;
  for (const t of turns) {
    if (t.role === 'agent') {
      if (t.questionId && !t.followUp) current = script.find((i) => i.id === t.questionId);
      continue;
    }
    answersCount++;
    if (!current) continue;
    if (current.kind === 'choice') {
      const letter = parseChoice(t.content, current);
      if (letter) choices[current.id] = letter;
    } else {
      notes[current.id] = notes[current.id] ? `${notes[current.id]} ${t.content}` : t.content;
    }
  }
  return { notes, choices, answersCount };
}

// ---------- Sugerencia preliminar (demo) ----------

interface Evaluation {
  perQuestion: { id: string; competency: string; score: number; pluralOnly: boolean }[];
  choices: { id: string; competency: string; letter: ChoiceLetter | null; points: number | null }[];
  discrepancies: Discrepancy[];
  answersCount: number;
  notesCount: number;
  notesTotal: number;
  choicesCount: number;
  choicesTotal: number;
}

const PLURAL = /\b(hicimos|logramos|trabajamos|pudimos|decidimos|resolvimos|atendimos|nosotros|nos organizamos|entre todos)\b/i;
const FIRST_PERSON = /\b(yo|hice|logr[eé]|decid[ií]|propuse|me encargu[eé]|llam[eé]|atend[ií]|resolv[ií]|organic[eé]|habl[eé]|ofrec[ií]|revis[eé]|aprend[ií]|busqu[eé]|ped[ií]|escuch[eé]|expliqu[eé]|vend[ií]|sub[ií]|aument[eé])\b/i;
const MEASURABLE = /(\d+\s*(%|por ciento|clientes|ventas|unidades|motos|quetzales|q\b|d[ií]as|semanas|meses))|\b(result[oó]|aument[oó]|subi[oó]|mejor[oó]|logr[eé]|super[eé]|cumpl[ií])\b/i;

/**
 * Sugerencia 1–5 con la escala de la guía (orientativa; RR.HH. puntúa): un ejemplo
 * concreto con acciones propias y resultado sube; vago o en plural baja (tope de 3).
 */
function suggestScore(text: string): { score: number; pluralOnly: boolean } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  let score = words < 10 ? 2 : words < 25 ? 3 : 4;
  if (words >= 25 && MEASURABLE.test(text)) score = 5;
  else if (MEASURABLE.test(text)) score = Math.min(5, score + 1);
  const pluralOnly = PLURAL.test(text) && !FIRST_PERSON.test(text);
  if (pluralOnly) score = Math.min(score, SCALE[2].score);
  return { score: Math.max(1, Math.min(5, score)), pluralOnly };
}

function evaluate(transcript: Transcript, script: InterviewScriptItem[], cand: Candidate): Evaluation {
  const perQuestion = script
    .filter((i) => i.kind !== 'choice')
    .map((i) => {
      const text = transcript.notes[i.id] ?? '';
      const s = text ? suggestScore(text) : { score: 1, pluralOnly: false };
      return { id: i.id === 'story' ? 'Historia' : i.id, competency: i.competency ? competencyLabel(i.competency) : 'Historia (4 competencias)', ...s };
    });
  const choices = script
    .filter((i) => i.kind === 'choice')
    .map((i) => {
      const letter = transcript.choices[i.id] ?? null;
      const q = CHOICE_QUESTIONS.find((c) => c.id === i.id);
      const points = letter && q ? (q.options.find((o) => o.letter === letter)?.points ?? null) : null;
      return { id: i.id, competency: i.competency ? competencyLabel(i.competency) : '', letter, points };
    });

  // Discrepancia CV vs respuestas: años de experiencia mencionados vs los del CV.
  const discrepancies: Discrepancy[] = [];
  const cvYears = cand.parsed?.totalYears;
  const all = Object.values(transcript.notes).join(' ');
  const mention = all.match(/(\d+)\s*añ/i);
  if (cvYears && mention) {
    const n = parseInt(mention[1], 10);
    if (Math.abs(n - cvYears) >= 2) {
      discrepancies.push({
        topic: 'Años de experiencia',
        cvClaim: `CV: ${cvYears} años`,
        interviewClaim: `Entrevista: mencionó ${n} años`,
      });
    }
  }

  const notesTotal = script.filter((i) => i.kind !== 'choice').length;
  return {
    perQuestion,
    choices,
    discrepancies,
    answersCount: transcript.answersCount,
    notesCount: Object.values(transcript.notes).filter((n) => n.trim()).length,
    notesTotal,
    choicesCount: Object.keys(transcript.choices).length,
    choicesTotal: script.length - notesTotal,
  };
}
