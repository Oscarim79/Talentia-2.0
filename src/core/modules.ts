// ============================================================
//  Módulos opcionales del producto.
//  Software OPINADO: el catálogo es fijo. La empresa solo decide si un
//  módulo está encendido o apagado — no lo configura.
// ============================================================

export type ModuleId = 'interviewsAi';

/**
 * Secciones fijas de la app que tienen su propia ayuda guiada (recorrido, "cómo funciona",
 * video y preguntas del chat), aparte del flujo base de Reclutamiento. No se encienden ni
 * se apagan: siempre están en el menú.
 */
export type SectionId = 'talent' | 'management';

/** Todo lo que tiene ayuda guiada propia: módulos opcionales y secciones fijas. */
export type GuideId = ModuleId | SectionId;

export const SECTION_IDS: readonly SectionId[] = ['talent', 'management'];

export function isSectionId(x: unknown): x is SectionId {
  return typeof x === 'string' && (SECTION_IDS as readonly string[]).includes(x);
}

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
      'Un asistente de IA entrevista al candidato por videollamada (Zoom) con la guía de entrevista por competencias de RR.HH. (Vendedor o Jefe de Tienda, según la vacante), transcribe cada respuesta bajo su pregunta y la deja como borrador en Entrevistas, con una sugerencia preliminar de puntaje y las discrepancias CV vs respuestas. RR.HH. puntúa y decide. En la demo la videollamada se simula con un chat.',
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
