import { useId, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Explicación corta de un elemento. A diferencia del `title` del navegador, aparece
 * al pasar el cursor, al enfocar con el teclado y al tocar en pantalla táctil, y los
 * lectores de pantalla la leen (aria-describedby). Para envolver contenido informativo
 * (badges, marcas), no botones.
 */
export function Tooltip({ text, children, className }: { text: string; children: ReactNode; className?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn('relative inline-flex max-w-full', className)}
      tabIndex={0}
      aria-describedby={id}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      {children}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[16rem] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {text}
      </span>
    </span>
  );
}
