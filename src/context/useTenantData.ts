import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useTenant } from './TenantContext';

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor. Si persiste, avísale a Oscar.';

/** Solo se recarga al volver a ver la pestaña. */
export function shouldReloadOnVisibility(state: DocumentVisibilityState): boolean {
  return state === 'visible';
}

/** Cualquier fallo de carga se muestra con el mismo mensaje sencillo. */
export function networkMessage(_err: unknown): string {
  return NETWORK_MESSAGE;
}

/**
 * Qué hacer cuando falla una carga. Solo la PRIMERA carga de una empresa muestra
 * error y reinicia los datos; una recarga de fondo fallida conserva lo que ya hay.
 */
export function reduceLoadError<T>(
  hasLoaded: boolean,
  prevData: T,
  initial: T,
  err: unknown,
): { data: T; error: string | null } {
  return hasLoaded ? { data: prevData, error: null } : { data: initial, error: networkMessage(err) };
}

/**
 * Empresa cuyos datos actuales vienen de una carga exitosa. Un fallo para otra empresa
 * (o sin éxito previo) vacía los datos, así que el éxito recordado se descarta.
 */
export function nextSucceededFor(prev: string | null, requested: string, ok: boolean): string | null {
  if (ok) return requested;
  return prev === requested ? prev : null;
}

/**
 * Carga los datos de la empresa actual. Recarga al cambiar de empresa y al volver
 * a la pestaña. Si falla la primera carga: `error`, `ready = true` y `data = initial`.
 * Si falla una recarga posterior, se conservan los datos y solo se avisa en consola.
 */
export function useTenantData<T>(
  load: (tenantId: string) => Promise<T>,
  initial: T,
): { data: T; setData: Dispatch<SetStateAction<T>>; ready: boolean; error: string | null; reload: () => void } {
  const { tenant } = useTenant();
  const [data, setData] = useState<T>(initial);
  // Empresa a la que pertenecen los datos actuales: así `ready` nunca muestra filas de otra empresa.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Siempre la última versión de lo recibido, sin re-disparar el efecto.
  const loadRef = useRef(load);
  const initialRef = useRef(initial);
  const dataRef = useRef(data);
  // Empresa cuya última carga TUVO ÉXITO (distinto de loadedFor, que incluye intentos fallidos).
  const succeededForRef = useRef<string | null>(null);
  const currentTenant = useRef(tenant.id);
  loadRef.current = load;
  initialRef.current = initial;
  dataRef.current = data;
  currentTenant.current = tenant.id;

  const reload = useCallback(() => setTick((n) => n + 1), []);
  // Al cambiar de empresa, el error de la anterior no debe seguir visible.
  useEffect(() => {
    setError(null);
  }, [tenant.id]);

  useEffect(() => {
    const requested = tenant.id;
    let cancelled = false;
    loadRef.current(requested).then(
      (result) => {
        // Ignorar respuestas viejas (la empresa cambió mientras tanto).
        if (cancelled || currentTenant.current !== requested) return;
        setData(result);
        succeededForRef.current = nextSucceededFor(succeededForRef.current, requested, true);
        setError(null);
        setLoadedFor(requested);
      },
      (err) => {
        if (cancelled || currentTenant.current !== requested) return;
        const hasLoaded = succeededForRef.current === requested;
        if (hasLoaded) console.warn('[talentia] No se pudo actualizar los datos en segundo plano', err);
        const next = reduceLoadError(hasLoaded, dataRef.current, initialRef.current, err);
        succeededForRef.current = nextSucceededFor(succeededForRef.current, requested, false);
        setData(next.data);
        setError(next.error);
        setLoadedFor(requested);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [tenant.id, tick]);

  useEffect(() => {
    const onVisibility = () => {
      if (shouldReloadOnVisibility(document.visibilityState)) reload();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [reload]);

  return { data, setData, ready: loadedFor === tenant.id, error, reload };
}
