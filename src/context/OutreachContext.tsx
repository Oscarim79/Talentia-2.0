import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { providers } from '../core/providers';
import { insertMessage, listMessages, updateMessage } from '../core/db/outreach';
import { notifyError } from '../lib/notify';
import { hashString, newId } from '../lib/utils';
import type { Candidate, OutreachChannel, OutreachMessage } from '../types';
import { useCandidates } from './CandidatesContext';
import { useTenantData } from './useTenantData';

/**
 * Bandeja de respuestas automáticas a CVs. Vive por encima de las páginas para
 * que el historial no se pierda al navegar, y se guarda en Supabase (`outreach_messages`).
 * En demo, la "respuesta del candidato" se simula de forma determinista unos
 * segundos después del envío; al confirmar, el candidato pasa a la etapa Entrevista.
 */
interface SendInput {
  candidate: Candidate;
  channel: OutreachChannel;
  subject: string;
  body: string;
  /** Fecha y hora propuesta a este candidato (texto tal como va en el mensaje). */
  slot: string;
}

interface OutreachCtxValue {
  messages: OutreachMessage[];
  send: (inputs: SendInput[]) => Promise<void>;
  lastFor: (candidateId: string) => OutreachMessage | undefined;
  sending: boolean;
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const NONE: OutreachMessage[] = [];

/** Simulación demo: 4 de cada 5 confirman; el resto queda "sin respuesta" para poder reenviar. */
function simulatedReply(candidateId: string): 'confirmed' | 'no_reply' {
  return hashString(candidateId) % 5 !== 0 ? 'confirmed' : 'no_reply';
}

const OutreachContext = createContext<OutreachCtxValue | null>(null);

export function OutreachProvider({ children }: { children: ReactNode }) {
  const { markInterviewScheduled, markReplied, ready: candidatesReady } = useCandidates();
  const { data: messages, setData, ready, error, reload } = useTenantData(listMessages, NONE);
  const [sending, setSending] = useState(false);
  const timers = useRef<number[]>([]);
  /** Mensajes de esta sesión con respuesta simulada pendiente (no se resuelven como "viejos"). */
  const inFlight = useRef<Set<string>>(new Set());
  /** Mensajes cargados que ya se resolvieron / ya se sincronizó su candidato. */
  const resolved = useRef<Set<string>>(new Set());

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /** Cambia el mensaje en pantalla y lo guarda. Si falla, avisa (el estado local queda como está). */
  const patch = useCallback(
    (id: string, p: Partial<Pick<OutreachMessage, 'status' | 'confirmedSlot'>>) => {
      setData((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
      updateMessage(id, p).catch(() => notifyError(SAVE_ERROR));
    },
    [setData],
  );

  // Mensajes que quedaron esperando antes de cargar: se resuelven con la misma simulación.
  // Las entrevistas confirmadas dejan al candidato en la etapa Entrevista (idempotente).
  useEffect(() => {
    if (!ready || !candidatesReady) return;
    for (const m of messages) {
      if (inFlight.current.has(m.id) || resolved.current.has(m.id)) continue;
      if (m.status === 'queued' || m.status === 'delivered') {
        resolved.current.add(m.id);
        if (simulatedReply(m.candidateId) === 'confirmed') {
          patch(m.id, { status: 'confirmed', confirmedSlot: m.confirmedSlot ?? m.slot });
          markInterviewScheduled(m.candidateId);
        } else patch(m.id, { status: 'no_reply' });
      } else if (m.status === 'confirmed') {
        resolved.current.add(m.id);
        markInterviewScheduled(m.candidateId);
      }
    }
  }, [messages, ready, candidatesReady, patch, markInterviewScheduled]);

  const send = useCallback(
    async (inputs: SendInput[]) => {
      if (inputs.length === 0) return;
      setSending(true);
      try {
        for (const { candidate, channel, subject, body, slot } of inputs) {
          const to = channel === 'whatsapp' ? candidate.phone : candidate.email;
          const msg: OutreachMessage = {
            id: newId('msg'),
            tenantId: candidate.tenantId,
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            jobId: candidate.jobId,
            channel,
            to,
            body,
            status: 'queued',
            sentAt: new Date().toISOString(),
            slot,
          };
          inFlight.current.add(msg.id);
          setData((prev) => [msg, ...prev]);
          try {
            await insertMessage(msg);
          } catch {
            setData((prev) => prev.filter((m) => m.id !== msg.id));
            inFlight.current.delete(msg.id);
            notifyError(SAVE_ERROR);
            continue;
          }

          if (channel === 'whatsapp') await providers.messaging.sendWhatsApp({ to, body });
          else await providers.messaging.sendEmail({ to, subject, body });
          patch(msg.id, { status: 'delivered' });
          markReplied(candidate.id);

          // Simulación demo de la respuesta del candidato (determinista por id).
          const t = window.setTimeout(() => {
            inFlight.current.delete(msg.id);
            if (simulatedReply(candidate.id) === 'confirmed') {
              patch(msg.id, { status: 'confirmed', confirmedSlot: slot });
              markInterviewScheduled(candidate.id);
            } else patch(msg.id, { status: 'no_reply' });
          }, 2500 + (hashString(candidate.id) % 2000));
          timers.current.push(t);
        }
      } finally {
        setSending(false);
      }
    },
    [patch, setData, markReplied, markInterviewScheduled],
  );

  const value = useMemo<OutreachCtxValue>(
    () => ({
      messages,
      send,
      sending,
      lastFor: (candidateId) => messages.find((m) => m.candidateId === candidateId),
      ready,
      error,
      reload,
    }),
    [messages, send, sending, ready, error, reload],
  );

  return <OutreachContext.Provider value={value}>{children}</OutreachContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOutreach() {
  const ctx = useContext(OutreachContext);
  if (!ctx) throw new Error('useOutreach debe usarse dentro de <OutreachProvider>');
  return ctx;
}
