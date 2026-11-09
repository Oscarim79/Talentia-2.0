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
 * Carga los datos de la empresa actual. Recarga al cambiar de empresa y al volver
 * a la pestaña. Si falla: `error` con mensaje, `ready = true` y `data = initial`.
 */
export function useTenantData<T>(
  load: (tenantId: string) => Promise<T>,
  initial: T,
): { data: T; setData: Dispatch<SetStateAction<T>>; ready: boolean; error: string | null; reload: () => void } {
  const { tenant } = useTenant();
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Siempre la última versión de lo recibido, sin re-disparar el efecto.
  const loadRef = useRef(load);
  const initialRef = useRef(initial);
  const currentTenant = useRef(tenant.id);
  loadRef.current = load;
  initialRef.current = initial;
  currentTenant.current = tenant.id;

  const reload = useCallback(() => setTick((n) => n + 1), []);

  // Al cambiar de empresa, no mostrar datos de la anterior mientras carga.
  useEffect(() => {
    setReady(false);
  }, [tenant.id]);

  useEffect(() => {
    const requested = tenant.id;
    let cancelled = false;
    loadRef.current(requested).then(
      (result) => {
        // Ignorar respuestas viejas (la empresa cambió mientras tanto).
        if (cancelled || currentTenant.current !== requested) return;
        setData(result);
        setError(null);
        setReady(true);
      },
      (err) => {
        if (cancelled || currentTenant.current !== requested) return;
        setData(initialRef.current);
        setError(networkMessage(err));
        setReady(true);
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

  return { data, setData, ready, error, reload };
}
