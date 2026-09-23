import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { providers } from '../core/providers';
import { hashString, newId } from '../lib/utils';
import type { Candidate, OutreachChannel, OutreachMessage } from '../types';
import { useCandidates } from './CandidatesContext';

/**
 * Bandeja de respuestas automáticas a CVs. Vive por encima de las páginas para
 * que el historial no se pierda al navegar, y se guarda en este navegador (demo).
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
}

const STORAGE_KEY = 'talentia.outreach.v1';

/** Simulación demo: 4 de cada 5 confirman; el resto queda "sin respuesta" para poder reenviar. */
function simulatedReply(candidateId: string): 'confirmed' | 'no_reply' {
  return hashString(candidateId) % 5 !== 0 ? 'confirmed' : 'no_reply';
}

function load(): OutreachMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as OutreachMessage[]) : [];
    if (!Array.isArray(saved)) return [];
    // Mensajes que quedaron esperando al recargar: se resuelven con la misma simulación.
    return saved.map((m) => {
      if (m.status !== 'queued' && m.status !== 'delivered') return m;
      return simulatedReply(m.candidateId) === 'confirmed'
        ? { ...m, status: 'confirmed', confirmedSlot: m.confirmedSlot ?? m.slot }
        : { ...m, status: 'no_reply' };
    });
  } catch {
    return [];
  }
}

const OutreachContext = createContext<OutreachCtxValue | null>(null);

export function OutreachProvider({ children }: { children: ReactNode }) {
  const { markInterviewScheduled } = useCandidates();
  const [messages, setMessages] = useState<OutreachMessage[]>(load);
  const [sending, setSending] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  // Entrevistas confirmadas antes de recargar: el candidato sigue en la etapa Entrevista (idempotente).
  useEffect(() => {
    messages.filter((m) => m.status === 'confirmed').forEach((m) => markInterviewScheduled(m.candidateId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(0, 500)));
    } catch {
      /* sin almacenamiento: la sesión sigue en memoria */
    }
  }, [messages]);

  const patch = useCallback((id: string, p: Partial<OutreachMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }, []);

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
          setMessages((prev) => [msg, ...prev]);

          if (channel === 'whatsapp') await providers.messaging.sendWhatsApp({ to, body });
          else await providers.messaging.sendEmail({ to, subject, body });
          patch(msg.id, { status: 'delivered' });

          // Simulación demo de la respuesta del candidato (determinista por id).
          const t = window.setTimeout(() => {
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
    [patch, markInterviewScheduled],
  );

  const value = useMemo<OutreachCtxValue>(
    () => ({
      messages,
      send,
      sending,
      lastFor: (candidateId) => messages.find((m) => m.candidateId === candidateId),
    }),
    [messages, send, sending],
  );

  return <OutreachContext.Provider value={value}>{children}</OutreachContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOutreach() {
  const ctx = useContext(OutreachContext);
  if (!ctx) throw new Error('useOutreach debe usarse dentro de <OutreachProvider>');
  return ctx;
}
