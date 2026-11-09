/** Formatea una fecha como YYYY-MM-DD usando la hora local (no UTC). */
function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fecha de hoy (o la indicada) en formato YYYY-MM-DD, según la hora local. */
export function todayISO(d: Date = new Date()): string {
  return formatISO(d);
}

/** Suma (o resta, con número negativo) días a una fecha YYYY-MM-DD. Cálculo en UTC para evitar saltos por horario de verano. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
