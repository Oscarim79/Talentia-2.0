import type { EvaluationPeriod } from '../../types';

// ============================================================
//  Motor de decisiones de RR.HH. — reglas de política deterministas.
//  De la tendencia del historial (semáforo por trimestre) se deriva
//  una acción sugerida: reconocimiento/bono/aumento o advertencia/
//  suspensión/desvinculación. NO usa IA: son reglas auditables.
// ============================================================

export type Light = 'verde' | 'amarillo' | 'rojo';

/** Semáforo del trimestre según el promedio desempeño+cultura (escala 1-5). */
export function periodLight(p: EvaluationPeriod): Light {
  // Redondeo a 2 decimales para evitar bordes por imprecisión de punto flotante.
  const avg = Math.round(((p.performanceScore + p.cultureScore) / 2) * 100) / 100;
  if (avg >= 3.6) return 'verde';
  if (avg < 2.5) return 'rojo';
  return 'amarillo';
}

export const LIGHT_META: Record<Light, { label: string; dot: string; bar: string; text: string }> = {
  verde: { label: 'Positivo', dot: 'bg-green-500', bar: 'bg-green-500', text: 'text-green-700' },
  amarillo: { label: 'En observación', dot: 'bg-amber-500', bar: 'bg-amber-500', text: 'text-amber-700' },
  rojo: { label: 'En riesgo', dot: 'bg-red-500', bar: 'bg-red-500', text: 'text-red-700' },
};

export type DecisionTone = 'positive' | 'neutral' | 'negative' | 'critical';

export interface Decision {
  tone: DecisionTone;
  label: string; // acción sugerida
  detail: string; // explicación
  rationale: string; // base (la racha que la dispara)
  streak: number;
  light: Light;
}

/** Racha del semáforo actual (cuántos trimestres consecutivos termina con el mismo). */
function currentStreak(lights: Light[]): { light: Light; streak: number } {
  const light = lights[lights.length - 1];
  let streak = 0;
  for (let i = lights.length - 1; i >= 0 && lights[i] === light; i--) streak++;
  return { light, streak };
}

export function deriveDecision(history: EvaluationPeriod[]): Decision {
  const lights = history.map(periodLight);
  const { light, streak } = currentStreak(lights);
  const base = { streak, light };

  if (light === 'verde') {
    if (streak >= 4)
      return { ...base, tone: 'positive', label: 'Aumento de sueldo / ascenso', detail: 'Año completo de alto desempeño sostenido — candidato a mejora salarial o promoción.', rationale: `${streak} trimestres consecutivos en positivo (más de un año).` };
    if (streak === 3)
      return { ...base, tone: 'positive', label: 'Premio + candidato a ascenso', detail: 'Tres trimestres seguidos de buen desempeño.', rationale: '3 trimestres consecutivos en positivo.' };
    if (streak === 2)
      return { ...base, tone: 'positive', label: 'Bono por desempeño + día de permiso', detail: 'Mejora sostenida dos trimestres.', rationale: '2 trimestres consecutivos en positivo.' };
    return { ...base, tone: 'positive', label: 'Reconocimiento formal', detail: 'Buen trimestre — felicitación formal.', rationale: 'Trimestre en positivo.' };
  }

  if (light === 'rojo') {
    if (streak >= 3)
      return { ...base, tone: 'critical', label: 'Recomendación de desvinculación', detail: 'Bajo desempeño crónico pese al seguimiento.', rationale: `${streak} trimestres consecutivos en riesgo.` };
    if (streak === 2)
      return { ...base, tone: 'critical', label: 'Suspensión + plan de mejora final', detail: 'Segundo trimestre consecutivo en riesgo.', rationale: '2 trimestres consecutivos en riesgo.' };
    return { ...base, tone: 'negative', label: 'Carta de advertencia', detail: 'Primer trimestre en riesgo — alerta formal.', rationale: 'Trimestre en riesgo.' };
  }

  // amarillo
  if (streak >= 3)
    return { ...base, tone: 'neutral', label: 'Capacitación obligatoria + plan de mejora', detail: 'Estancamiento prolongado en zona media.', rationale: `${streak} trimestres consecutivos en observación.` };
  if (streak === 2)
    return { ...base, tone: 'neutral', label: 'Seguimiento cercano + meta de mejora', detail: 'Dos trimestres en zona media.', rationale: '2 trimestres consecutivos en observación.' };
  return { ...base, tone: 'neutral', label: 'Plan de seguimiento', detail: 'Trimestre en zona media — acompañamiento.', rationale: 'Trimestre en observación.' };
}

export const TONE_STYLES: Record<DecisionTone, { box: string; title: string }> = {
  positive: { box: 'border-green-200 bg-green-50', title: 'text-green-800' },
  neutral: { box: 'border-amber-200 bg-amber-50', title: 'text-amber-800' },
  negative: { box: 'border-orange-200 bg-orange-50', title: 'text-orange-800' },
  critical: { box: 'border-red-200 bg-red-50', title: 'text-red-800' },
};

// Agrupa los tonos de decisión en 3 cubetas de acción.
export type ActionBucket = 'risk' | 'reward' | 'followup';

export function bucketOf(tone: DecisionTone): ActionBucket {
  if (tone === 'critical' || tone === 'negative') return 'risk';
  if (tone === 'positive') return 'reward';
  return 'followup';
}

export function toneBadge(tone: DecisionTone): 'green' | 'amber' | 'red' {
  if (tone === 'positive') return 'green';
  if (tone === 'critical' || tone === 'negative') return 'red';
  return 'amber';
}
