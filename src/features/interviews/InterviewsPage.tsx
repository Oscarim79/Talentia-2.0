import { useEffect, useMemo, useRef, useState } from 'react';
import { Phone, MessageCircle, Video, Bot, User, Send, Play, RotateCcw, Loader2, FileText } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { CANDIDATES } from '../../data/seed';
import { providers } from '../../core/providers';
import { Card, PageHeader, Badge, Button } from '../../components/ui/primitives';
import type { InterviewTurn, Candidate, Job } from '../../types';

const CHANNELS = [
  { icon: Phone, label: 'Teléfono', desc: 'Agente de voz (Vapi/Retell)', tag: 'Fase 3' },
  { icon: MessageCircle, label: 'WhatsApp', desc: 'Entrevista por texto + agendamiento', tag: 'Fase 2' },
  { icon: Video, label: 'Google Meet', desc: 'Bot que graba y transcribe (Recall.ai)', tag: 'Fase 3' },
];

export default function InterviewsPage() {
  const { tenant } = useTenant();
  const { jobs } = useJobs();

  // Candidatos puntuados de la empresa actual, disponibles para entrevistar.
  const candidates = useMemo(
    () => CANDIDATES.filter((c) => c.tenantId === tenant.id && c.screeningStatus === 'scored'),
    [tenant.id],
  );

  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? '');
  const candidate = candidates.find((c) => c.id === candidateId) ?? candidates[0];
  const job = jobs.find((j) => j.id === candidate?.jobId);

  const [messages, setMessages] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Si cambia el tenant y el candidato ya no pertenece, ajusta + reinicia.
  useEffect(() => {
    if (!candidates.some((c) => c.id === candidateId)) setCandidateId(candidates[0]?.id ?? '');
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const started = messages.length > 0;
  const context = candidate && job ? buildContext(candidate, job) : '';

  function reset() {
    setMessages([]);
    setInput('');
    setThinking(false);
    setEnded(false);
  }

  function start() {
    if (!candidate || !job) return;
    const firstQ = job.questions[0]?.text ?? `¿Qué experiencia tienes relacionada con el puesto de ${job.title}?`;
    setEnded(false);
    setMessages([
      {
        role: 'agent',
        content: `Hola ${candidate.firstName}, soy el asistente de TALENTIA para la vacante de ${job.title}. Será una breve conversación. ${firstQ}`,
      },
    ]);
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking || ended) return;
    const history: InterviewTurn[] = [...messages, { role: 'candidate', content: text }];
    setMessages(history);
    setInput('');
    setThinking(true);

    const reply = await providers.llm.interviewReply({ history, context });
    setMessages([...history, { role: 'agent', content: reply }]);
    setThinking(false);
    // El agente cierra la entrevista con esta frase del cierre.
    if (/reclutador te contactar/i.test(reply)) setEnded(true);
  }

  const candidateTurns = messages.filter((m) => m.role === 'candidate').length;

  return (
    <div>
      <PageHeader
        title="Entrevistas IA"
        subtitle="El agente entrevista en vivo, repregunta y mantiene el contexto del CV. Tú respondes como el candidato."
        actions={<Badge variant="amber">Demo interactiva · WhatsApp</Badge>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CHANNELS.map((ch) => (
          <Card key={ch.label} className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                <ch.icon className="h-5 w-5" />
              </div>
              <Badge variant="slate">{ch.tag}</Badge>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">{ch.label}</p>
            <p className="text-xs text-slate-500">{ch.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chat interactivo */}
        <Card className="flex h-[560px] flex-col lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidato</span>
              <select
                value={candidateId}
                onChange={(e) => {
                  setCandidateId(e.target.value);
                  reset();
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {started && (
                <Button variant="ghost" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> Reiniciar
                </Button>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {!started ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-indigo-50 p-3 text-indigo-600">
                  <Bot className="h-7 w-7" />
                </div>
                <p className="max-w-xs text-sm text-slate-500">
                  Inicia la entrevista con <b>{candidate?.firstName ?? 'el candidato'}</b> para la vacante
                  {' '}<b>{job?.title ?? '—'}</b>. El agente usa el contexto del CV para repreguntar.
                </p>
                <Button className="mt-4" onClick={start} disabled={!candidate || !job}>
                  <Play className="h-4 w-4" /> Iniciar entrevista
                </Button>
              </div>
            ) : (
              <>
                {messages.map((t, i) => (
                  <Bubble key={i} turn={t} />
                ))}
                {thinking && (
                  <div className="flex gap-3">
                    <Avatar role="agent" />
                    <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3 text-slate-400">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                )}
                {ended && (
                  <div className="pt-2 text-center text-xs font-medium text-green-600">
                    ✓ Entrevista finalizada — un reclutador dará seguimiento.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          {started && (
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  disabled={ended || thinking}
                  placeholder={ended ? 'Entrevista finalizada' : 'Responde como el candidato…'}
                  className="max-h-28 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
                <Button onClick={send} disabled={!input.trim() || thinking || ended}>
                  {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Panel lateral: contexto del CV (para detectar discrepancias en vivo) */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <FileText className="h-4 w-4 text-indigo-500" /> Contexto del CV
            </h3>
            {candidate?.parsed ? (
              <div className="space-y-3 text-sm">
                <Row label="Experiencia">{candidate.parsed.totalYears} años</Row>
                <Row label="Educación">{candidate.parsed.education}</Row>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.parsed.skills.map((s) => (
                      <Badge key={s} variant="brand">{s}</Badge>
                    ))}
                  </div>
                </div>
                {candidate.parsed.experience[0] && (
                  <Row label="Último rol">
                    {candidate.parsed.experience[0].role} · {candidate.parsed.experience[0].company}
                  </Row>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin CV parseado para este candidato.</p>
            )}
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Compara lo que dice en la entrevista con el CV. La detección automática de discrepancias llega en Fase 3.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-700">Sesión</h3>
            <div className="space-y-2 text-sm">
              <Row label="Estado">
                <Badge variant={!started ? 'slate' : ended ? 'green' : 'amber'}>
                  {!started ? 'Sin iniciar' : ended ? 'Finalizada' : 'En curso'}
                </Badge>
              </Row>
              <Row label="Respuestas">{candidateTurns}</Row>
              <Row label="Canal">WhatsApp (texto)</Row>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildContext(candidate: Candidate, job: Job): string {
  const p = candidate.parsed;
  const cv = p
    ? `CV: ${p.skills.join(', ')}; ${p.totalYears} años de experiencia; educación ${p.education}.`
    : 'CV sin parsear.';
  return `Candidato ${candidate.firstName} ${candidate.lastName} para la vacante "${job.title}" (${job.department}). ${cv}`;
}

function Avatar({ role }: { role: InterviewTurn['role'] }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        role === 'agent' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
      }`}
    >
      {role === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
    </div>
  );
}

function Bubble({ turn }: { turn: InterviewTurn }) {
  const isAgent = turn.role === 'agent';
  return (
    <div className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
      <Avatar role={turn.role} />
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
          isAgent ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-slate-800'
        }`}
      >
        {turn.content}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{children}</span>
    </div>
  );
}
