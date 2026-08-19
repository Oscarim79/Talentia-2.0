/**
 * Fuente única de verdad de la matriz 9-Box.
 * El cuadrante de una persona SIEMPRE se deriva de sus scores con `quadrantFromScores`;
 * nunca se escribe a mano. Así la etiqueta y el punto dibujado no pueden divergir.
 */

export const NINE_BOX_MIN = 1;
export const NINE_BOX_MAX = 5;

// Cortes que dividen la escala 1–5 en tercios iguales (los mismos de la cuadrícula dibujada).
const STEP = (NINE_BOX_MAX - NINE_BOX_MIN) / 3;
const LOW_CUT = NINE_BOX_MIN + STEP; // ≈2.33
const HIGH_CUT = NINE_BOX_MIN + STEP * 2; // ≈3.67

/** Nombres por celda: filas = cultura (baja → alta), columnas = desempeño (bajo → alto). */
export const NINE_BOX_QUADRANTS: readonly (readonly [string, string, string])[] = [
  ['Crítico o Inadecuado', 'Buen Colaborador', 'Profesional'], // cultura baja
  ['Colaborador Inconsistente', 'Colaborador Clave', 'Estrella'], // cultura media
  ['Diamante en Bruto', 'Futuro Líder', 'Superestrella'], // cultura alta
];

function band(score: number): 0 | 1 | 2 {
  if (score < LOW_CUT) return 0;
  if (score < HIGH_CUT) return 1;
  return 2;
}

/** Deriva el cuadrante 9-Box desde los scores (escala 1–5). */
export function quadrantFromScores(performanceScore: number, cultureScore: number): string {
  return NINE_BOX_QUADRANTS[band(cultureScore)][band(performanceScore)];
}
