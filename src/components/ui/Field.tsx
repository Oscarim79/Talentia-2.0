import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Campo de formulario: etiqueta visible enlazada al control, texto de ayuda y
 * mensaje de error debajo del campo (enlazados con aria-describedby, y el control
 * marcado con aria-invalid). El hijo debe ser un solo control (input, select, textarea).
 */
export function Field({
  label,
  help,
  error,
  children,
  className,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  const child = Children.only(children);
  const control = isValidElement(child)
    ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <div className={cn('block', className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      {control}
      {help && (
        <p id={helpId} className="mt-1 text-xs text-neutral-500">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
