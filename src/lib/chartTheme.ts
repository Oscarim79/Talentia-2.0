import { useMemo } from 'react';

/**
 * Colores de las gráficas (Recharts no usa clases de Tailwind, así que se le pasan valores).
 * Todos salen de las variables de `src/index.css`: si cambia la marca, cambian las gráficas.
 */
export const CHART = {
  grid: 'var(--color-chart-grid)',
  tick: 'var(--color-chart-tick)',
  cursor: 'var(--color-chart-cursor)',
  label: 'var(--color-chart-label)',
  brand: 'var(--color-brand-600)',
  ink: 'var(--color-ink)',
  /** Etapas del embudo, de la más temprana a la contratación. */
  funnel: [
    'var(--color-funnel-1)',
    'var(--color-funnel-2)',
    'var(--color-funnel-3)',
    'var(--color-funnel-4)',
    'var(--color-funnel-5)',
  ],
} as const;

export type ChartColors = { [K in keyof typeof CHART]: (typeof CHART)[K] extends readonly string[] ? string[] : string };

/** Convierte `var(--x)` en el color ya calculado del documento (algunos SVG no resuelven variables en atributos). */
function resolve(value: string, styles: CSSStyleDeclaration | null): string {
  const name = value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
  if (!name || !styles) return value;
  return styles.getPropertyValue(name).trim() || value;
}

export function readChartColors(): ChartColors {
  const styles = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  return {
    grid: resolve(CHART.grid, styles),
    tick: resolve(CHART.tick, styles),
    cursor: resolve(CHART.cursor, styles),
    label: resolve(CHART.label, styles),
    brand: resolve(CHART.brand, styles),
    ink: resolve(CHART.ink, styles),
    funnel: CHART.funnel.map((c) => resolve(c, styles)),
  };
}

/** Colores de gráfica ya resueltos, calculados una vez por montaje. */
export function useChartColors(): ChartColors {
  return useMemo(readChartColors, []);
}

/** Estilo común del cuadro flotante (Tooltip de Recharts). */
export function chartTooltipStyle(colors: ChartColors) {
  return { borderRadius: 12, border: `1px solid ${colors.grid}`, fontSize: 13 };
}
