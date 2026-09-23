import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { CANDIDATES } from '../../data/seed';
import { providers } from '../../core/providers';
import { useHelp } from '../help/HelpContext';
import type { Candidate, Job, InterviewTurn, Discrepancy } from '../../types';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';

// Americana 2000 entrevista por videollamada (cadena en todo el país): es el canal principal.
const CHANNELS = [
  { icon: Video, label: 'Videollamada', desc: 'El asistente entra a la videollamada (Google Meet), graba y transcribe (Recall.ai)', tag: 'Fase 3' },
  { icon: MessageCircle, label: 'WhatsApp', desc: 'Entrevista por texto + agendamiento', tag: 'Fase 2' },
  { icon: Phone, label: 'Teléfono', desc: 'Agente de voz (Vapi/Retell)', tag: 'Fase 3' },
];

// Banco de respaldo cuando la vacante no tiene preguntas configuradas.
const GENERIC_QUESTIONS = [
  '¿Por qué te interesa este puesto?',
  'Cuéntame de un logro del que te sientas orgulloso.',
  '¿Cuál es tu disponibilidad para empezar?',
];

export default function InterviewsPage() {
  const { tenant } = useTenant();
  const { jobs } = useJobs();
  const { openModuleIntro } = useHelp();

  // Candidatos entrevistables del tenant (ya puntuados en screening).
  const candidates = useMemo(
    () =>
      CANDIDATES.filter(
        (c) =>
          c.tenantId === tenant.id &&
          c.screeningStatus === 'scored' &&
          (c.stage === 'interview' || c.stage === 'screening'),
      ),
    [tenant.id],
  );

  const [candId, setCandId] = useState('');
  // Por defecto, el primero en etapa de entrevista (o el primero disponible).
  useEffect(() => {
    const preferred = candidates.find((c) => c.stage === 'interview') ?? candidates[0];
    setCandId(preferred?.id ?? '');
  }, [candidates]);

  const cand = candidates.find((c) => c.id === candId);
  const job = jobs.find((j) => j.id === cand?.jobId);
  const questionTexts = useMemo(() => {
    const fromJob = job?.questions.map((q) => q.text) ?? [];
    return fromJob.length ? fromJob : GENERIC_QUESTIONS;
  }, [job]);

  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
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
      questions: questionTexts,
    });
    // Si la conversación cambió mientras el agente "pensaba", descarta la respuesta.
    if (gen !== genRef.current) return;
    setThinking(false);
    setTurns((prev) => [...prev, { role: 'agent', content: res.message }]);
    if (res.done) setDone(true);
  }

  function startInterview() {
    setTurns([]);
    setDone(false);
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

  const evaluation = done && cand ? evaluate(turns, questionTexts, job, cand) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Entrevistas IA"
        subtitle="El asistente entrevista por videollamada con el banco de preguntas de la vacante, transcribe y evalúa. RR.HH. decide."
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
          {job && <Badge variant="stone">{job.title}</Badge>}
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
                  <p className="max-w-xs text-sm text-stone-500">
                    El asistente hará {questionTexts.length} preguntas del banco de la vacante. En la demo la videollamada se simula con este chat: responde como lo haría el candidato.
                  </p>
                  <Button onClick={startInterview} disabled={thinking}>
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
            {!evaluation ? (
              <Card className="p-5">
                <h3 className="mb-2 text-sm font-bold text-stone-700">Evaluación</h3>
                <p className="text-sm text-stone-500">
                  El puntaje por pregunta, el global y las discrepancias CV vs respuestas aparecen al finalizar la entrevista.
                </p>
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <h3 className="mb-2 text-sm font-bold text-stone-700">Puntaje global IA</h3>
                  <p className={`text-4xl font-black ${scoreColor(evaluation.global)}`}>
                    {evaluation.global}
                    <span className="text-lg text-stone-400">/100</span>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{recommendation(evaluation.global)}</p>
                </Card>

                <Card className="p-5">
                  <h3 className="mb-3 text-sm font-bold text-stone-700">Por pregunta</h3>
                  <div className="space-y-2.5">
                    {evaluation.perQuestion.map((q, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 text-xs">
                        <span className="text-stone-600">{q.question}</span>
                        <Badge variant={q.score >= 8 ? 'green' : q.score >= 5 ? 'amber' : 'red'}>
                          {q.score}/10
                        </Badge>
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

// ---------- Evaluación heurística (demo) ----------

interface Evaluation {
  global: number;
  perQuestion: { question: string; score: number }[];
  discrepancies: Discrepancy[];
  answersCount: number;
}

/** Puntaje 1–10 por respuesta: longitud + cobertura de los must-have de la vacante. */
function scoreAnswer(text: string, job?: Job): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  let s = 4;
  if (words >= 6) s += 2;
  if (words >= 18) s += 1;
  const positives = (job?.filters.filter((f) => f.polarity === 'positive') ?? []).map((f) =>
    f.criterion.toLowerCase(),
  );
  const lower = text.toLowerCase();
  const hits = positives.filter((p) => lower.includes(p.split(' ')[0])).length;
  s += Math.min(hits * 2, 3);
  return Math.max(1, Math.min(10, s));
}

function evaluate(
  turns: InterviewTurn[],
  questions: string[],
  job: Job | undefined,
  cand: Candidate,
): Evaluation {
  const answers = turns.filter((t) => t.role === 'candidate').map((t) => t.content);
  const perQuestion = answers.map((a, i) => ({
    question: questions[i] ?? `Pregunta ${i + 1}`,
    score: scoreAnswer(a, job),
  }));
  const global = perQuestion.length
    ? Math.round((perQuestion.reduce((acc, q) => acc + q.score, 0) / perQuestion.length) * 10)
    : 0;

  // Discrepancia CV vs respuestas: años de experiencia mencionados vs los del CV.
  const discrepancies: Discrepancy[] = [];
  const cvYears = cand.parsed?.totalYears;
  const mention = answers.join(' ').match(/(\d+)\s*añ/i);
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

  return { global, perQuestion, discrepancies, answersCount: answers.length };
}

function scoreColor(g: number): string {
  if (g >= 80) return 'text-green-600';
  if (g >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function recommendation(g: number): string {
  if (g >= 80) return 'Recomendado para avanzar a oferta.';
  if (g >= 60) return 'Perfil aceptable, evaluar con el equipo.';
  return 'Por debajo del umbral; revisar con cuidado.';
}
