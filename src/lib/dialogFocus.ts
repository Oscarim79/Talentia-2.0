import { useEffect, type RefObject } from 'react';

/**
 * Foco dentro de las ventanas emergentes (diálogos): entra al abrir, Tab no se escapa
 * por detrás y vuelve al botón que la abrió al cerrar.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A dónde debe ir el foco al pulsar Tab (o Shift+Tab) dentro de un diálogo.
 * Devuelve `null` cuando el navegador puede avanzar solo (el foco está en medio de la lista).
 */
export function getTabTarget(items: HTMLElement[], active: Element | null, shift: boolean): HTMLElement | null {
  if (items.length === 0) return null;
  const first = items[0];
  const last = items[items.length - 1];
  if (!active || !items.includes(active as HTMLElement)) return first;
  if (!shift && active === last) return first;
  if (shift && active === first) return last;
  return null;
}

/** Controles enfocables dentro de un contenedor, en orden de documento. */
export function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.closest('[hidden]'));
}

// Diálogos abiertos, del más antiguo al más reciente: solo el de arriba atrapa el Tab.
const openDialogs: HTMLElement[] = [];

/**
 * Úsalo en el contenedor del diálogo (con `tabIndex={-1}` para que pueda recibir el foco).
 * - Al abrir: enfoca el primer control (o el contenedor), salvo que un hijo ya tenga `autoFocus`.
 * - Mientras está abierto: Tab y Shift+Tab dan la vuelta dentro del diálogo.
 * - Al cerrar: devuelve el foco a donde estaba antes de abrir.
 *
 * `active`: para componentes que siguen montados cuando la ventana está cerrada (devuelven null),
 * pásale si la ventana está abierta; así el efecto se repite en cada apertura.
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;
    const previous = document.activeElement as HTMLElement | null;
    openDialogs.push(container);

    if (!container.contains(document.activeElement)) {
      (focusableIn(container)[0] ?? container).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || openDialogs[openDialogs.length - 1] !== container) return;
      const next = getTabTarget(focusableIn(container), document.activeElement, e.shiftKey);
      if (next) {
        e.preventDefault();
        next.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const i = openDialogs.lastIndexOf(container);
      if (i >= 0) openDialogs.splice(i, 1);
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [ref, active]);
}
