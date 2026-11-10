import { useSyncExternalStore } from 'react';
import { CircleAlert, X } from 'lucide-react';
import { dismissNotice, getNotices, subscribeNotices } from '../lib/notify';

/**
 * Avisos de error de la app (ver `lib/notify.ts`). Se monta una sola vez, en App.
 * Reemplaza al `alert` del navegador: no bloquea la página y funciona en navegadores integrados.
 */
export function Notices() {
  const notices = useSyncExternalStore(subscribeNotices, getNotices, getNotices);
  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="assertive">
      {notices.map((n) => (
        <div
          key={n.id}
          role="alert"
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white p-3.5 text-sm text-red-800 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
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
      ))}
    </div>
  );
}
