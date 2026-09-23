import { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  MessageCircle,
  Mail,
  Send,
  CalendarCheck,
  Zap,
  Inbox,
  Eye,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarClock,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useJobs } from '../../context/JobsContext';
import { useSettings } from '../../context/SettingsContext';
import { useOutreach } from '../../context/OutreachContext';
import { useCandidates } from '../../context/CandidatesContext';
import { useEscape } from '../../lib/useEscape';
import { cn } from '../../lib/utils';
import type { Candidate, Job, OutreachChannel, OutreachMessage, Tenant } from '../../types';
import { Card, PageHeader, Badge, Button, scoreVariant } from '../../components/ui/primitives';
import { Toggle } from '../settings/SettingsPage';

// ---------- Plantilla estándar (software opinado: una sola, con campos fijos) ----------

type Modality = 'presencial' | 'llamada' | 'videollamada';
// Americana 2000 entrevista en línea por Zoom (cadena en todo el país): es la opción por defecto.
// Cada modalidad trae su indicación por defecto (se puede editar).
const MODALITIES: { key: Modality; label: string; phrase: string; place: string }[] = [
  { key: 'videollamada', label: 'Virtual por Zoom', phrase: 'virtual por Zoom', place: 'Al confirmar tu horario te enviaremos el enlace de la entrevista por Zoom.' },
  { key: 'llamada', label: 'Llamada telefónica', phrase: 'por llamada telefónica', place: 'Al confirmar tu horario te llamaremos a este número.' },
  { key: 'presencial', label: 'Presencial', phrase: 'presencial', place: 'Al confirmar tu horario te enviaremos la dirección. Ten a mano tu DPI.' },
];

/** Aviso que el mensaje agrega cuando la entrevista la hará el asistente de IA (módulo Entrevistas IA). */
const AI_NOTICE = 'La entrevista la hará nuestro asistente virtual con inteligencia artificial y se grabará para evaluarla.';

interface ReplyOptions {
  modality: Modality;
  place: string;
  contact: string;
  /** La entrevista la hace el asistente de IA: agrega el aviso de IA y grabación. */
  aiInterview: boolean;
}

/** Mensaje estándar acordado con RR.HH. de Americana (Reynaldo, 2026-09-22): un solo horario por candidato. */
function composeMessage(cand: Candidate, job: Job | undefined, tenant: Tenant, o: ReplyOptions, slot: string): string {
  const mod = MODALITIES.find((m) => m.key === o.modality)?.phrase ?? '';
  const brand = job?.brand ?? tenant.name;
  return [
    `Hola ${cand.firstName}, gracias por enviar tu CV para la vacante de ${job?.title ?? 'la posición'} en ${brand}. ` +
      `Tu perfil cumple con lo que buscamos y queremos conocerte en una entrevista ${mod}.`,
    slot,
    o.aiInterview ? AI_NOTICE : '',
    o.place.trim(),
    `— ${o.contact.trim() || 'Recursos Humanos'} · ${brand}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ---------- Horarios: uno por candidato ----------

/** Duraciones posibles de cada entrevista (minutos). */
const DURATIONS = [15, 20, 30, 45, 60];
/** Hora de cierre de la agenda: si un horario la pasa, sigue el siguiente día hábil. */
const DAY_END_MIN = 17 * 60;

/** Siguiente día hábil después de `from`, a la hora y minuto dados. */
function nextBusinessDay(from: Date, hour: number, minute = 0): Date {
  const d = new Date(from);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Valor de `<input type="datetime-local">` (hora local): "2026-09-24T10:00". */
function toInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fromInput(v: string): Date | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Como va en el mensaje: "miércoles, 23 de septiembre, 10:00 a.m.". */
function formatSlot(d: Date): string {
  const day = new Intl.DateTimeFormat('es-GT', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day}, ${h12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

/** Horarios seguidos desde `start`, uno cada `minutes`; al pasar las 17:00 sigue el siguiente día hábil. */
function sequence(start: Date, n: number, minutes: number): Date[] {
  const out: Date[] = [];
  let d = new Date(start);
  for (let i = 0; i < n; i++) {
    out.push(new Date(d));
    d = new Date(d.getTime() + minutes * 60_000);
    if (d.getHours() * 60 + d.getMinutes() + minutes > DAY_END_MIN) d = nextBusinessDay(d, start.getHours(), start.getMinutes());
  }
  return out;
}

function requirementsMet(c: Candidate): { met: number; total: number } {
  const ev = c.evidence ?? [];
  return { met: ev.filter((e) => e.matched).length, total: ev.length };
}

// ---------- Página ----------

export default function CvReplyPage() {
  const { tenant } = useTenant();
  const { jobs: allJobs } = useJobs();
  const { settings, setAutoReply, isModuleEnabled } = useSettings();
  const { messages, send, sending, lastFor } = useOutreach();
  const { candidates } = useCandidates();
  const aiModule = isModuleEnabled('interviewsAi');

  const jobs = useMemo(() => allJobs.filter((j) => j.tenantId === tenant.id), [allJobs, tenant.id]);
  // Incluye los CVs cargados en Screening IA (CandidatesContext), no solo los de ejemplo.
  // Quien ya tiene oferta, fue contratado o descartado no recibe invitación a entrevista.
  const tenantCands = useMemo(
    () => candidates.filter((c) => c.screeningStatus === 'scored' && !['offer', 'hired', 'rejected'].includes(c.stage)),
    [candidates],
  );

  // ---- Filtros ----
  const [jobId, setJobId] = useState<string>('all');
  const [minScore, setMinScore] = useState(70);
  const [criterion, setCriterion] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [replyFilter, setReplyFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ---- Respuesta ----
  const [channel, setChannel] = useState<OutreachChannel>('whatsapp');
  const [modality, setModality] = useState<Modality>('videollamada');
  const [place, setPlace] = useState(MODALITIES[0].place);
  const [contact, setContact] = useState('Recursos Humanos');
  const [aiChoice, setAiChoice] = useState(true);
  const aiInterview = aiModule && aiChoice;
  // Agenda: primera entrevista + duración → horarios seguidos; cada fila puede cambiar el suyo.
  const [firstSlot, setFirstSlot] = useState(() => toInput(nextBusinessDay(new Date(), 10)));
  const [duration, setDuration] = useState(30);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Candidate | null>(null);

  // Al cambiar de empresa: limpiar selección y filtros dependientes.
  useEffect(() => {
    setJobId('all');
    setCriterion('all');
    setSelected(new Set());
    setPreview(null);
  }, [tenant.id]);

  const job = jobId === 'all' ? undefined : jobs.find((j) => j.id === jobId);
  const criteria = useMemo(() => {
    const src = job ? [job] : jobs;
    return Array.from(new Set(src.flatMap((j) => j.filters.filter((f) => f.polarity === 'positive').map((f) => f.criterion))));
  }, [job, jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenantCands
      .filter((c) => (jobId === 'all' ? true : c.jobId === jobId))
      .filter((c) => (c.screeningScore ?? 0) >= minScore)
      .filter((c) =>
        criterion === 'all' ? true : (c.evidence ?? []).some((e) => e.criterion === criterion && e.matched),
      )
      .filter((c) => {
        if (!q) return true;
        const hay = `${c.firstName} ${c.lastName} ${c.email} ${(c.parsed?.skills ?? []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      })
      .filter((c) => {
        const m = lastFor(c.id);
        if (replyFilter === 'pending') return !m || m.status === 'no_reply';
        if (replyFilter === 'sent') return !!m && m.status !== 'no_reply';
        return true;
      })
      .sort((a, b) => (b.screeningScore ?? 0) - (a.screeningScore ?? 0));
  }, [tenantCands, jobId, minScore, criterion, query, replyFilter, lastFor]);

  const opts: ReplyOptions = { modality, place, contact, aiInterview };

  /** Horario de cada candidato, en orden: el que se cambió a mano o el siguiente de la agenda. */
  function assignSlots(cands: Candidate[]): Map<string, Date> {
    const start = fromInput(firstSlot) ?? nextBusinessDay(new Date(), 10);
    const auto = cands.filter((c) => !(overrides[c.id] && fromInput(overrides[c.id])));
    const seq = sequence(start, auto.length, duration);
    const map = new Map<string, Date>();
    auto.forEach((c, i) => map.set(c.id, seq[i]));
    cands.forEach((c) => {
      const o = overrides[c.id] && fromInput(overrides[c.id]);
      if (o) map.set(c.id, o);
    });
    return map;
  }
  function changeModality(m: Modality) {
    // Si la indicación es la de fábrica, cambia junto con la modalidad; si la editaste, se respeta.
    if (MODALITIES.some((x) => x.place === place)) setPlace(MODALITIES.find((x) => x.key === m)!.place);
    setModality(m);
  }
  const jobOf = (c: Candidate) => jobs.find((j) => j.id === c.jobId);
  /** Se puede responder si nunca se le escribió o si no contestó (reenvío). */
  const canReply = (c: Candidate) => {
    const m = lastFor(c.id);
    return !m || m.status === 'no_reply';
  };

  const selectedCands = filtered.filter((c) => selected.has(c.id));
  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function sendTo(cands: Candidate[], slotsOf: Map<string, Date> = assignSlots(cands.filter(canReply))) {
    const pending = cands.filter(canReply);
    if (pending.length === 0) return;
    await send(
      pending.map((c) => {
        const slot = formatSlot(slotsOf.get(c.id)!);
        return {
          candidate: c,
          channel,
          subject: `Entrevista para ${jobOf(c)?.title ?? 'la vacante'} · ${jobOf(c)?.brand ?? tenant.name}`,
          body: composeMessage(c, jobOf(c), tenant, opts, slot),
          slot,
        };
      }),
    );
    setSelected(new Set());
    setOverrides((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !pending.some((c) => c.id === id))));
  }

  // Regla automática: responde a todo CV puntuado ≥ umbral que aún no tenga respuesta.
  const ruleTargets = tenantCands.filter((c) => (c.screeningScore ?? 0) >= settings.autoReply.minScore && canReply(c));
  async function runRule() {
    await sendTo(ruleTargets);
  }
  async function toggleRule(on: boolean) {
    setAutoReply({ ...settings.autoReply, enabled: on });
    if (on) await runRule();
  }

  const tenantMessages = messages.filter((m) => m.tenantId === tenant.id);
  const queue = selectedCands.filter(canReply);
  const pendingSelected = queue.length;
  const queueSlots = assignSlots(queue);
  /** Horario que recibiría `c`: el suyo si está en la cola; si no, el siguiente libre. */
  const slotFor = (c: Candidate) => queueSlots.get(c.id) ?? assignSlots([...queue, c]).get(c.id)!;

  return (
    <div>
      <PageHeader
        eyebrow="Reclutamiento"
        title="Respuestas a CVs"
        subtitle="Filtra los CVs recibidos y responde automáticamente a los candidatos para agendar la entrevista."
        actions={
          <Badge variant={settings.autoReply.enabled ? 'green' : 'stone'}>
            <Zap className="h-3 w-3" />
            {settings.autoReply.enabled ? `Regla activa · score ≥ ${settings.autoReply.minScore}` : 'Regla automática apagada'}
          </Badge>
        }
      />

      {/* Filtros */}
      <Card className="mb-5 p-5" dataTour="reply:filters">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          <Filter className="h-3.5 w-3.5" /> Filtro de CVs
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Vacante">
            <select value={jobId} onChange={(e) => { setJobId(e.target.value); setCriterion('all'); }} className={inputCls}>
              <option value="all">Todas las vacantes</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </Field>
          <Field label={`Score mínimo · ${minScore}`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
              aria-label="Score mínimo"
            />
          </Field>
          <Field label="Requisito cumplido">
            <select value={criterion} onChange={(e) => setCriterion(e.target.value)} className={inputCls}>
              <option value="all">Cualquiera</option>
              {criteria.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Buscar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, correo o habilidad"
              className={inputCls}
            />
          </Field>
          <Field label="Respuesta">
            <select value={replyFilter} onChange={(e) => setReplyFilter(e.target.value as typeof replyFilter)} className={inputCls}>
              <option value="all">Todos</option>
              <option value="pending">Sin responder</option>
              <option value="sent">Ya respondidos</option>
            </select>
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Lista de candidatos */}
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={filtered.length === 0}
                aria-label="Seleccionar todos"
                className="h-4 w-4 accent-brand-600"
              />
              <h2 className="text-sm font-bold text-stone-700">
                {filtered.length} {filtered.length === 1 ? 'CV cumple' : 'CVs cumplen'} el filtro
              </h2>
            </div>
            <Button onClick={() => sendTo(selectedCands)} disabled={sending || pendingSelected === 0} dataTour="reply:send">
              <Send className="h-4 w-4" />
              {sending ? 'Enviando…' : `Responder a ${pendingSelected} seleccionado${pendingSelected === 1 ? '' : 's'}`}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-stone-400">
              {tenantCands.length === 0
                ? 'Sin CVs puntuados para esta empresa. Puntúa CVs en Screening IA primero.'
                : 'Ningún CV cumple el filtro. Baja el score mínimo o cambia los criterios.'}
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {filtered.map((c) => {
                const req = requirementsMet(c);
                const msg = lastFor(c.id);
                const j = jobOf(c);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      aria-label={`Seleccionar a ${c.firstName} ${c.lastName}`}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {c.firstName[0]}{c.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {c.firstName} {c.lastName}
                        <span className="ml-2 text-xs font-normal text-stone-400">{j?.title}{j?.brand ? ` · ${j.brand}` : ''}</span>
                      </p>
                      <p className="truncate text-[11px] text-stone-400">
                        {c.phone} · {c.email} · {(c.parsed?.skills ?? []).slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.total > 0 && (
                        <Badge variant={req.met === req.total ? 'green' : 'stone'}>
                          {req.met}/{req.total} requisitos
                        </Badge>
                      )}
                      <Badge variant={scoreVariant(c.screeningScore ?? 0)}>{c.screeningScore}</Badge>
                      <StatusBadge msg={msg} />
                      <button
                        onClick={() => setPreview(c)}
                        aria-label="Vista previa del mensaje"
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    {selected.has(c.id) && canReply(c) && (
                      <div className="flex w-full flex-wrap items-center gap-2 pl-7 sm:pl-[64px]" data-tour={c.id === queue[0]?.id ? 'reply:slot' : undefined}>
                        <CalendarClock className="h-3.5 w-3.5 text-brand-600" />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Entrevista</span>
                        <input
                          type="datetime-local"
                          value={toInput(queueSlots.get(c.id)!)}
                          onChange={(e) => setOverrides((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          aria-label={`Horario de la entrevista de ${c.firstName} ${c.lastName}`}
                          className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-[11px] text-stone-500">{formatSlot(queueSlots.get(c.id)!)}</span>
                        {overrides[c.id] ? (
                          <button
                            onClick={() => setOverrides((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== c.id)))}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" /> Usar el de la agenda
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400">(de la agenda)</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Respuesta automática */}
        <div className="space-y-4">
          <Card className="p-5" dataTour="reply:template">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-700">
              <CalendarCheck className="h-4 w-4 text-brand-600" /> Mensaje para agendar entrevista
            </h3>
            <div className="space-y-3">
              <Field label="Canal">
                <div className="flex gap-2">
                  <ChannelBtn active={channel === 'whatsapp'} onClick={() => setChannel('whatsapp')} icon={MessageCircle} label="WhatsApp" />
                  <ChannelBtn active={channel === 'email'} onClick={() => setChannel('email')} icon={Mail} label="Correo" />
                </div>
              </Field>
              <Field label="Modalidad">
                <select value={modality} onChange={(e) => changeModality(e.target.value as Modality)} className={inputCls}>
                  {MODALITIES.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </Field>
              <div className="space-y-3" data-tour="reply:agenda">
                <Field label="Primera entrevista (fecha y hora)">
                  <input type="datetime-local" value={firstSlot} onChange={(e) => e.target.value && setFirstSlot(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Duración de cada entrevista">
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d} minutos</option>
                    ))}
                  </select>
                </Field>
                <p className="text-[11px] text-stone-400">
                  Cada seleccionado recibe su propio horario, uno seguido del otro (después de las 5:00 p.m. pasa al siguiente día hábil). Cámbialo en su fila si tu agenda lo pide.
                </p>
              </div>
              {aiModule && (
                <label className="flex items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50/60 p-3" data-tour="reply:ai-notice">
                  <input type="checkbox" checked={aiChoice} onChange={(e) => setAiChoice(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                  <span className="text-xs text-stone-700">
                    <span className="flex items-center gap-1 font-semibold text-stone-800"><Bot className="h-3.5 w-3.5 text-brand-600" /> La entrevista la hará el asistente de IA</span>
                    Agrega al mensaje: "{AI_NOTICE}" Desmárcala si la entrevista la hará una persona del equipo.
                  </span>
                </label>
              )}
              <Field label="Indicaciones (opcional)">
                <textarea value={place} onChange={(e) => setPlace(e.target.value)} rows={2} className={cn(inputCls, 'resize-y')} />
              </Field>
              <Field label="Firma">
                <input value={contact} onChange={(e) => setContact(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              Plantilla estándar de TALENTIA: el nombre, la vacante, la marca y el horario se completan solos por cada candidato.
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-stone-700">
                  <Zap className="h-4 w-4 text-gold-500" /> Regla automática
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Responder solo a los CVs con score ≥ <b>{settings.autoReply.minScore}</b> apenas terminan el screening.
                </p>
              </div>
              <Toggle checked={settings.autoReply.enabled} onChange={toggleRule} label="Activar regla automática" />
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={settings.autoReply.minScore}
              onChange={(e) => setAutoReply({ ...settings.autoReply, minScore: Number(e.target.value) })}
              className="mt-3 w-full accent-brand-600"
              aria-label="Umbral de la regla automática"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-stone-500">
                {ruleTargets.length} CV{ruleTargets.length === 1 ? '' : 's'} pendiente{ruleTargets.length === 1 ? '' : 's'} de respuesta
              </span>
              <Button variant="secondary" onClick={runRule} disabled={sending || ruleTargets.length === 0}>
                Ejecutar ahora
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Bandeja de envíos */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-stone-700">
            <Inbox className="h-4 w-4 text-brand-600" /> Bandeja de envíos
          </h2>
          <Badge variant="stone">{tenantMessages.length}</Badge>
        </div>
        {tenantMessages.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-400">Aún no se ha enviado ninguna respuesta.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="px-5 py-3 font-semibold">Hora</th>
                  <th className="px-5 py-3 font-semibold">Candidato</th>
                  <th className="px-5 py-3 font-semibold">Canal</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Entrevista</th>
                </tr>
              </thead>
              <tbody>
                {tenantMessages.map((m) => (
                  <tr key={m.id} className="border-b border-stone-50 last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-stone-500">
                      {new Date(m.sentAt).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-stone-800">
                      {m.candidateName}
                      <span className="ml-2 text-xs font-normal text-stone-400">{m.to}</span>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{m.channel === 'whatsapp' ? 'WhatsApp' : 'Correo'}</td>
                    <td className="px-5 py-3"><StatusBadge msg={m} /></td>
                    <td className="px-5 py-3 text-stone-600">
                      {m.confirmedSlot ?? (m.slot ? <span className="text-stone-400">{m.slot} (propuesto)</span> : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {preview && (
        <PreviewModal
          candidate={preview}
          text={canReply(preview) ? composeMessage(preview, jobOf(preview), tenant, opts, formatSlot(slotFor(preview))) : lastFor(preview.id)!.body}
          channel={canReply(preview) ? channel : lastFor(preview.id)!.channel}
          onClose={() => setPreview(null)}
          onSend={canReply(preview) ? () => { sendTo([preview], new Map([[preview.id, slotFor(preview)]])); setPreview(null); } : undefined}
          resend={!!lastFor(preview.id)}
        />
      )}
    </div>
  );
}

// ---------- Subcomponentes ----------

const inputCls =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</span>
      {children}
    </label>
  );
}

function ChannelBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
        active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50',
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function StatusBadge({ msg }: { msg?: OutreachMessage }) {
  if (!msg) return <Badge variant="stone">Sin responder</Badge>;
  switch (msg.status) {
    case 'queued':
      return <Badge variant="amber"><Clock className="h-3 w-3" /> Enviando…</Badge>;
    case 'delivered':
      return <Badge variant="blue"><Send className="h-3 w-3" /> Enviado · esperando</Badge>;
    case 'confirmed':
      return <Badge variant="green"><CheckCircle2 className="h-3 w-3" /> Entrevista agendada</Badge>;
    case 'no_reply':
      return <Badge variant="red"><AlertCircle className="h-3 w-3" /> Sin respuesta</Badge>;
  }
}

function PreviewModal({
  candidate,
  text,
  channel,
  onClose,
  onSend,
  resend,
}: {
  candidate: Candidate;
  text: string;
  channel: OutreachChannel;
  onClose: () => void;
  onSend?: () => void;
  resend?: boolean;
}) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Mensaje para ${candidate.firstName} ${candidate.lastName}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-stone-800">{candidate.firstName} {candidate.lastName}</p>
            <p className="text-xs text-stone-400">
              {channel === 'whatsapp' ? `WhatsApp · ${candidate.phone}` : `Correo · ${candidate.email}`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-stone-700">
          {text}
        </pre>
        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {onSend && (
            <Button onClick={onSend}>
              <Send className="h-4 w-4" /> {resend ? 'Reenviar' : 'Enviar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
