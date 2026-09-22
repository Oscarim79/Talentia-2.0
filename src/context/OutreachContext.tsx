import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { providers } from '../core/providers';
import { hashString, newId } from '../lib/utils';
import type { Candidate, OutreachChannel, OutreachMessage } from '../types';

/**
 * Bandeja de respuestas automáticas a CVs. Vive por encima de las páginas para
 * que el historial no se pierda al navegar. En demo, la "respuesta del candidato"
 * se simula de forma determinista unos segundos después del envío.
 */
interface SendInput {
  candidate: Candidate;
  channel: OutreachChannel;
  subject: string;
  body: string;
  /** Opciones de horario ofrecidas (para simular cuál confirma el candidato). */
  slots: string[];
}

interface OutreachCtxValue {
  messages: OutreachMessage[];
  send: (inputs: SendInput[]) => Promise<void>;
  lastFor: (candidateId: string) => OutreachMessage | undefined;
  sending: boolean;
}

const OutreachContext = createContext<OutreachCtxValue | null>(null);

export function OutreachProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [sending, setSending] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const patch = useCallback((id: string, p: Partial<OutreachMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  }, []);

  const send = useCallback(
    async (inputs: SendInput[]) => {
      if (inputs.length === 0) return;
      setSending(true);
      try {
        for (const { candidate, channel, subject, body, slots } of inputs) {
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
          };
          setMessages((prev) => [msg, ...prev]);

          if (channel === 'whatsapp') await providers.messaging.sendWhatsApp({ to, body });
          else await providers.messaging.sendEmail({ to, subject, body });
          patch(msg.id, { status: 'delivered' });

          // Simulación demo de la respuesta del candidato (determinista por id).
          const h = hashString(candidate.id);
          const replies = h % 5 !== 0; // 4 de cada 5 confirman; el resto queda "sin respuesta" para poder reenviar
          const t = window.setTimeout(() => {
            if (replies) patch(msg.id, { status: 'confirmed', confirmedSlot: slots[h % slots.length] ?? slots[0] });
            else patch(msg.id, { status: 'no_reply' });
          }, 2500 + (h % 2000));
          timers.current.push(t);
        }
      } finally {
        setSending(false);
      }
    },
    [patch],
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
