// Ayudas compartidas por los repositorios (mapeo fila <-> tipo de dominio).

/** Quita las claves con valor `undefined` (así `toEqual` y el JSON ven "ausente", no "undefined"). */
export function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/** `null` de la base de datos -> `undefined` del tipo de dominio. */
export function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v === null ? undefined : v;
}
