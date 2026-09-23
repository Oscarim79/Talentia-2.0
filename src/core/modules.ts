// ============================================================
//  Módulos opcionales del producto.
//  Software OPINADO: el catálogo es fijo. La empresa solo decide si un
//  módulo está encendido o apagado — no lo configura.
// ============================================================

export type ModuleId = 'interviewsAi';

export interface ModuleDef {
  id: ModuleId;
  name: string;
  description: string;
  /** Qué habilita en la app cuando está encendido. */
  unlocks: string;
  /** Apagado por defecto en toda empresa nueva. */
  defaultEnabled: boolean;
  /** Ruta que queda protegida por el módulo. */
  route: string;
}

export const MODULES: ModuleDef[] = [
  {
    id: 'interviewsAi',
    name: 'Entrevistas IA',
    description:
      'Un asistente de IA entrevista al candidato por videollamada con el banco de preguntas de la vacante, transcribe y evalúa (puntaje por pregunta, global y discrepancias CV vs respuestas). La decisión sigue siendo de RR.HH.',
    unlocks: 'Sección "Entrevistas IA" en el menú de Reclutamiento y una ayuda guiada que explica cómo funciona y qué hacer.',
    defaultEnabled: false,
    route: '/entrevistas',
  },
];

export function moduleDef(id: ModuleId): ModuleDef {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Módulo desconocido: ${id}`);
  return m;
}
