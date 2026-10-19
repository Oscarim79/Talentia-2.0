import { MODULES, type GuideId, type ModuleId, type SectionId } from '../../core/modules';
import type { HelpVideoId, TourId } from './tourSteps';

/**
 * Guía de cada módulo opcional y de cada sección fija con ayuda propia (Talento, Gestión).
 * La de un módulo se muestra al activarlo (ayuda guiada) y desde Ayuda → Guía; la de una
 * sección, desde Ayuda → Guía ("Cómo funciona"). Si cambia la pantalla, actualizar aquí,
 * en su recorrido (`tourSteps.ts`), en sus preguntas de `data/helpFaq.ts` (campo `topic`)
 * y en el guion de su video (`docs/video/<nombre>/narration.json`).
 */
export interface ModuleGuide {
  /** Módulo opcional o sección fija a la que pertenece. */
  module: GuideId;
  /** Recorrido guiado que ofrece (mismo id que el módulo o la sección). */
  tour: TourId;
  title: string;
  summary: string;
  /** Cómo funciona, en el orden en que ocurre. */
  howItWorks: { title: string; body: string }[];
  /** Qué le toca hacer a RR.HH. */
  todo: { text: string; route?: string; routeLabel?: string }[];
  /** Qué es simulado en la demo. */
  demoNote: string;
  video: HelpVideoId;
  /** Preguntas del chat de ayuda (ids de `HELP_FAQ`) que se sugieren al abrirlo desde la ayuda del módulo o la sección. */
  chatSuggestions: string[];
}

export const MODULE_GUIDES: Record<ModuleId, ModuleGuide> = {
  interviewsAi: {
    module: 'interviewsAi',
    tour: 'interviewsAi',
    title: 'Entrevistas IA por videollamada',
    summary:
      'Un asistente con inteligencia artificial entrevista por videollamada (Zoom) a los candidatos que agendaste, con la misma guía de competencias de RR.HH. que usaría una persona, y te deja la transcripción lista para puntuar en Entrevistas. La decisión sigue siendo de RR.HH.',
    howItWorks: [
      {
        title: 'Las preguntas de la guía',
        body: 'El asistente hace exactamente las preguntas de la guía de competencias que corresponde a la vacante (Vendedor: 10 conductuales, la historia y 5 de opción múltiple; Jefe de Tienda: 12, la historia y 6), en el orden de la guía, con repreguntas neutrales si la respuesta es vaga. No improvisa.',
      },
      {
        title: 'Agendas como siempre',
        body: 'En Respuestas a CVs, Virtual por Zoom, con la casilla "La entrevista la hará el asistente de IA": el mensaje avisa al candidato que lo entrevistará una IA y que se grabará.',
      },
      {
        title: 'El asistente entrevista',
        body: 'A la hora acordada entra a la videollamada de Zoom, se presenta como asistente virtual con IA y hace las preguntas una por una. Todo queda transcrito.',
      },
      {
        title: 'Deja la transcripción lista para puntuar',
        body: 'Cada respuesta queda anotada bajo su pregunta, como borrador en Entrevistas, con las opciones múltiples ya marcadas, una sugerencia preliminar de puntaje de 1 a 5 y las diferencias entre el CV y lo que dijo.',
      },
      {
        title: 'RR.HH. puntúa y decide',
        body: 'En Entrevistas lees la transcripción, puntúas de 1 a 5 cada respuesta y la app calcula el Índice General y la recomendación. La decisión (Oferta o Descartar) es tuya.',
      },
    ],
    todo: [
      {
        text: 'Revisa que cada vacante tenga la guía correcta: Vendedor o Jefe de Tienda. Se deduce del título y la tarjeta de la vacante la muestra; las "preguntas extra" del formulario son opcionales para el entrevistador.',
        route: '/vacantes',
        routeLabel: 'Ir a Vacantes',
      },
      {
        text: 'Al agendar en Respuestas a CVs, deja marcada la casilla "La entrevista la hará el asistente de IA": el mensaje agrega solo el aviso de IA y grabación. Desmárcala si la entrevista la hará una persona.',
        route: '/respuestas',
        routeLabel: 'Ir a Respuestas a CVs',
      },
      {
        text: 'Haz una entrevista de prueba: elige un candidato, pulsa "Iniciar entrevista" y responde como lo haría el candidato.',
        route: '/entrevistas',
        routeLabel: 'Probar ahora',
      },
      {
        text: 'Al terminar, abre "Puntuar en Entrevistas": lee cada respuesta, puntúa de 1 a 5 (la sugerencia de la IA es solo orientativa) y, si ves una diferencia con el CV, confírmala con el candidato.',
        route: '/competencias',
        routeLabel: 'Ir a Entrevistas',
      },
      {
        text: 'Si decides no usarlo, apaga el módulo en Configuración: solo se oculta del menú y no se pierde nada.',
      },
    ],
    demoNote:
      'La videollamada real (Zoom, con voz) está planeada para la Fase 3; hoy la entrevista se simula con un chat y tú escribes las respuestas del candidato (son todas las preguntas de la guía: 16 para Vendedor, 19 para Jefe de Tienda). La sugerencia de puntaje es una regla simple (ejemplo concreto, acciones propias, resultado medible) y el chat no se guarda al salir, pero la transcripción sí queda como borrador en Entrevistas. Quien confirma su entrevista en Respuestas a CVs pasa a la etapa Entrevista y aparece en la lista.',
    video: 'interviewsAi',
    chatSuggestions: ['entrevista-ia-como', 'entrevista-ia-pasos', 'entrevista-ia-evaluacion', 'entrevista-ia-aviso'],
  },
};

/** Secciones fijas del menú con ayuda guiada propia (siempre activas; no se encienden ni se apagan). */
export const SECTION_GUIDES: Record<SectionId, ModuleGuide> = {
  talent: {
    module: 'talent',
    tour: 'talent',
    title: 'Talento: Matriz 9-Box y Acciones RR.HH.',
    summary:
      'Sigue a la gente ya contratada: la Matriz 9-Box ubica a cada colaborador según su desempeño y su cultura, el perfil guarda su historial por trimestre y Acciones RR.HH. sugiere qué hacer con cada quien (reconocer, dar seguimiento o advertir) y arma el reporte para cada gerente. La decisión es de RR.HH.',
    howItWorks: [
      {
        title: 'Los datos entran por plantillas',
        body: 'Colaboradores (RR.HH.), KPIs de Desempeño (ventas y metas del área) y Cultura 360° (10 dimensiones evaluadas por jefe, pares y equipo). La empresa solo llena y sube las plantillas estándar; no se configura nada.',
      },
      {
        title: 'La Matriz 9-Box ubica a cada persona',
        body: 'Desempeño (eje horizontal) contra cultura y potencial (eje vertical), ambos de 1 a 5, en 9 cuadrantes: de Crítico o Inadecuado (abajo a la izquierda) a Superestrella (arriba a la derecha). El cuadrante se calcula solo con los puntajes.',
      },
      {
        title: 'El perfil cuenta la historia',
        body: 'Desempeño, Cultura, eNPS, el historial de 6 trimestres con semáforo (verde desde 3.6, rojo abajo de 2.5), las 10 dimensiones 360° y la recomendación de crecimiento con los 7 Hábitos de Covey, lista para enviar por WhatsApp a la persona y a su jefe.',
      },
      {
        title: 'Acciones RR.HH. sugiere qué hacer',
        body: 'Según cuántos trimestres seguidos lleva la persona en verde, amarillo o rojo: reconocimiento, bono, premio o aumento; plan de seguimiento o capacitación; carta de advertencia, suspensión o recomendación de desvinculación. Son reglas fijas y auditables, sin IA.',
      },
      {
        title: 'RR.HH. decide y reporta',
        body: 'Marcas cada acción como hecha y envías a cada gerente el reporte de su equipo (a reconocer, en seguimiento, en riesgo) por WhatsApp, copiado o descargado.',
      },
    ],
    todo: [
      {
        text: 'Abre la Matriz 9-Box, filtra por tu departamento y toca a una persona para ver su perfil completo.',
        route: '/talento',
        routeLabel: 'Ir a la Matriz 9-Box',
      },
      {
        text: 'En el perfil, genera la recomendación de crecimiento y revisa el mensaje antes de enviarlo por WhatsApp a la persona o a su jefe.',
      },
      {
        text: 'En Acciones RR.HH., empieza por "Atención / riesgo": lee la base de cada sugerencia, decide y márcala como hecha.',
        route: '/acciones',
        routeLabel: 'Ir a Acciones RR.HH.',
      },
      {
        text: 'Envía a cada gerente el reporte de su equipo desde "Reportes a gerentes".',
      },
      {
        text: 'Anota qué dato de la persona te hace falta ver (tienda, antigüedad, metas del mes): es insumo para las plantillas.',
      },
    ],
    demoNote:
      'Los 9 colaboradores, sus puntajes y sus 6 trimestres son de ejemplo (uno por cuadrante). La recomendación de crecimiento la genera una IA simulada con reglas; en producción la hará la IA real con la evaluación completa. Lo marcado como hecho se olvida al recargar. La importación real de las plantillas llega con la Fase 2.',
    video: 'talent',
    chatSuggestions: ['talento-cuadrantes', 'talento-perfil', 'acciones', 'acciones-reporte'],
  },
  management: {
    module: 'management',
    tour: 'management',
    title: 'Gestión: Métricas RR.HH. y Configuración',
    summary:
      'Mide cuánto tarda cada persona del equipo en revisar, responder, entrevistar, decidir y cerrar, contra las metas en días, y señala los pendientes fuera de meta. En Configuración se definen el equipo, esas metas y los módulos opcionales. Es para el propio departamento de RR.HH., no para la gerencia.',
    howItWorks: [
      {
        title: 'Cada movimiento deja fecha',
        body: 'Cuando RR.HH. revisa un CV, responde, entrevista, decide o cierra la oferta, el candidato guarda la fecha. De esas fechas salen todos los tiempos; nadie llena nada aparte.',
      },
      {
        title: 'Las metas marcan el semáforo',
        body: 'Cada etapa tiene una meta en días (de fábrica: revisar 2, responder 1, entrevistar 5, decidir 3, cerrar 5). Verde dentro de la meta, ámbar hasta 1.5 veces, rojo después. Se editan en Configuración y se aplican al instante.',
      },
      {
        title: 'Métricas: cada quien y cada etapa',
        body: 'Los cuatro números del equipo, la tabla "Cada quien" por persona, el tiempo por etapa con el cuello de botella, el embudo de conversión, la tabla por vacante y la lista de pendientes con su responsable.',
      },
      {
        title: 'Configuración: equipo, metas y módulos',
        body: 'Quién está en el equipo de RR.HH. (aparecen en "Cada quien"), las metas en días y el catálogo fijo de módulos opcionales (hoy, Entrevistas IA). Nada más se configura: el proceso ya viene definido.',
      },
      {
        title: 'Las preguntas al chat mejoran la guía',
        body: 'Todo lo que preguntas en el botón Ayuda queda en Configuración → Preguntas al chat de ayuda, con "Sin respuesta" marcado, y se envía a Oscar con un clic.',
      },
    ],
    todo: [
      {
        text: 'En Métricas, mira "Cada quien" y la lista de "Pendientes por persona": lo que esté fuera de meta es lo primero del día.',
        route: '/metricas',
        routeLabel: 'Ir a Métricas RR.HH.',
      },
      {
        text: 'Usa los filtros de vacante y persona para ver solo lo tuyo o una plaza en particular.',
      },
      {
        text: 'En Configuración, cambia las metas en días a lo que hoy es realista para ustedes y revisa que el equipo esté completo.',
        route: '/configuracion',
        routeLabel: 'Ir a Configuración',
      },
      {
        text: 'Al terminar la semana, envía tus preguntas y comentarios desde "Preguntas al chat de ayuda" → "Enviar a Oscar".',
      },
      {
        text: 'Si quieres empezar de cero, "Restablecer la demo" borra lo guardado en este navegador.',
      },
    ],
    demoNote:
      'Los tiempos salen del set de ejemplo (23 candidatos de dos vacantes de Americana, con corte al 20 de junio de 2026): las fechas no avanzan con el reloj real y los CVs que cargues no entran todavía a Métricas. Equipo, metas y módulos se guardan solo en este navegador.',
    video: 'management',
    chatSuggestions: ['metricas', 'metricas-pendientes', 'metas', 'equipo'],
  },
};

/** Todas las guías (módulos opcionales + secciones fijas), por id. */
export const GUIDES: Record<GuideId, ModuleGuide> = { ...MODULE_GUIDES, ...SECTION_GUIDES };

export function isModuleGuide(id: GuideId): id is ModuleId {
  return MODULES.some((m) => m.id === id);
}
