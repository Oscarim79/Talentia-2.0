import { useEffect, useSyncExternalStore } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { dismissNotice, flushPendingNotice, getNotices, subscribeNotices, type NoticeTone } from '../lib/notify';
import { cn } from '../lib/utils';

const TONE: Record<NoticeTone, { card: string; icon: string; Icon: typeof CircleAlert }> = {
  error: { card: 'border-red-200 text-red-800', icon: 'text-red-600', Icon: CircleAlert },
  success: { card: 'border-green-200 text-green-800', icon: 'text-green-600', Icon: CircleCheck },
};

/**
 * Avisos de la app (ver `lib/notify.ts`). Se monta una sola vez, en App.
 * Reemplaza al `alert` del navegador: no bloquea la página y funciona en navegadores integrados.
 */
export function Notices() {
  const notices = useSyncExternalStore(subscribeNotices, getNotices, getNotices);
  // Un aviso dejado antes de recargar la página (p. ej. "la demo volvió a los datos de ejemplo").
  useEffect(() => {
    flushPendingNotice();
  }, []);
  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="assertive">
      {notices.map((n) => {
        const { card, icon, Icon } = TONE[n.tone];
        return (
          <div
            key={n.id}
            role={n.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-white p-3.5 text-sm shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]',
              card,
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} />
            <p className="flex-1 leading-snug">{n.message}</p>
            <button
              type="button"
              onClick={() => dismissNotice(n.id)}
              aria-label="Cerrar aviso"
              className="-m-1 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
