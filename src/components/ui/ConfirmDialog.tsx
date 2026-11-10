import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from './primitives';
import { cn } from '../../lib/utils';
import { useEscape } from '../../lib/useEscape';

/**
 * Confirmación propia de la app, en lugar de `window.confirm` (que bloquea la página y no
 * funciona en navegadores integrados, como el de Claude).
 *
 * Uso: `const confirm = useConfirm();` y luego
 * `if (!(await confirm({ title, message, confirmLabel, tone: 'danger' }))) return;`
 * <ConfirmProvider> se monta una vez, en App.
 */

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Texto del botón que acepta. Por defecto "Confirmar". */
  confirmLabel?: string;
  /** Texto del botón que cancela. Por defecto "Cancelar". */
  cancelLabel?: string;
  /** 'danger' pinta el botón de aceptar en rojo (acciones que borran). */
  tone?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        // Si ya había una pregunta abierta, se da por cancelada.
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const settle = useCallback((ok: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setOptions(null);
    resolve?.(ok);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && <ConfirmDialog {...options} onConfirm={() => settle(true)} onCancel={() => settle(false)} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

/** La ventana en sí. Normalmente se usa a través de `useConfirm`. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  useEscape(onCancel);
  const danger = tone === 'danger';
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex gap-4 p-6">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700')}>
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-display text-lg font-semibold leading-tight text-ink">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-neutral-600">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
          {/* El foco empieza en Cancelar: la opción segura. */}
          <Button variant="secondary" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
