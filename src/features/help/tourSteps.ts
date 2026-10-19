import type { ModuleId, SectionId } from '../../core/modules';

/** Pasos del tour guiado: en qué pantalla, qué elemento se resalta y qué se explica. */
export interface TourStep {
  route: string;
  /** Valor de `data-tour` del elemento a resaltar (opcional: sin él, solo se muestra la tarjeta). */
  target?: string;
  title: string;
  body: string;
}

/** Tour general (Reclutamiento), recorrido de una sección fija (Talento, Gestión) o ayuda guiada de un módulo opcional. */
export type TourId = 'main' | SectionId | ModuleId;

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    target: 'nav:/',
    title: 'Bienvenido a TALENTIA',
    body: 'El menú de la izquierda sigue el orden real del trabajo: Reclutamiento (vacante → CVs → respuestas → entrevista → candidatos), Talento (la gente ya contratada) y Gestión (métricas y configuración). Este tour te lleva por cada paso.',
  },
  {
    route: '/vacantes',
    target: 'jobs:new',
    title: '1. Crea la vacante',
    body: 'Todo empieza aquí. "Nueva vacante" abre un formulario de 5 pasos: datos básicos y marca (Americana, Abiq o Friotec), descripción con IA, los filtros con los que la IA puntuará los CVs, preguntas extra opcionales para el entrevistador y revisión. La entrevista usa la guía de competencias (Vendedor o Jefe de Tienda, según el título). Al final puedes descargar el XML para LinkedIn.',
  },
  {
    route: '/screening',
    target: 'screening:dropzone',
    title: '2. Sube los CVs',
    body: 'Elige la vacante y arrastra los CVs (PDF, Word o imagen) a esta zona. La IA lee cada uno, lo puntúa de 0 a 100 contra los filtros de la vacante y los ordena. Verás la evidencia textual de cada requisito y, aparte, los archivos que no se pudieron leer. Los CVs quedan guardados y pasan a Respuestas a CVs.',
  },
  {
    route: '/respuestas',
    target: 'reply:filters',
    title: '3. Filtra los mejores CVs',
    body: 'Aquí filtras por vacante, score mínimo, requisito cumplido o nombre. Solo se muestran los CVs que cumplen; marca los que quieras contactar o usa "Seleccionar todos".',
  },
  {
    route: '/respuestas',
    target: 'reply:send',
    title: '4. Responde y agenda la entrevista',
    body: 'Con un clic se envía a cada seleccionado el mensaje estándar (WhatsApp o correo) para la entrevista virtual por Zoom, con su propia fecha y hora: se asignan seguidas desde la primera entrevista y puedes cambiar la de cualquiera en su fila. La Bandeja de envíos te dice quién confirmó y quién no contestó.',
  },
  {
    route: '/competencias',
    target: 'competencias:list',
    title: '5. Entrevista con la guía de competencias',
    body: 'En Entrevistas haces la entrevista por Zoom con la guía de RR.HH. (Vendedor o Jefe de Tienda). Elige al candidato en esta lista y sigue 3 pasos: 1) haces las preguntas en orden y anotas lo que dice, 2) al terminar puntúas cada respuesta de 1 a 5 y 3) la app calcula cada competencia, el Índice General y la recomendación. Desde el reporte lo pasas a Oferta o lo descartas.',
  },
  {
    route: '/candidatos',
    target: 'candidates:board',
    title: '6. Sigue a cada candidato',
    body: 'El tablero muestra a cada persona en su etapa: Aplicados, Screening, Entrevista, Oferta, Contratados y Descartados. Cada tarjeta lleva el score de la IA y, si ya lo entrevistaste, el resultado de su entrevista (tócalo para abrir el reporte).',
  },
  {
    route: '/metricas',
    target: 'metrics:people',
    title: '7. Mide cuánto tarda cada quien',
    body: 'Métricas RR.HH. muestra, por persona, cuánto tarda en revisar un CV, responder, entrevistar y cerrar, contra la meta de cada etapa (verde, ámbar, rojo), más los pendientes fuera de meta con su responsable.',
  },
  {
    route: '/configuracion',
    target: 'settings:goals',
    title: '8. Ajusta metas y equipo',
    body: 'En Configuración defines las metas en días, agregas personas al equipo de RR.HH. y enciendes módulos opcionales como Entrevistas IA por videollamada (al activarlo, se abre una ayuda guiada que explica cómo funciona). Nada más se configura: el proceso ya viene definido.',
  },
  {
    route: '/configuracion',
    target: 'help:launcher',
    title: '¿Dudas? Pregunta aquí',
    body: 'Este botón siempre está disponible. Tiene un chat de ayuda que responde cómo hacer cada cosa y te lleva a la pantalla correcta, la guía para repetir este tour y los videos con el recorrido completo. Talento (la gente ya contratada) y Gestión (métricas y configuración) tienen su propio recorrido en la pestaña Guía.',
  },
];

/**
 * Recorrido de la sección Talento (Matriz 9-Box y Acciones RR.HH.): la gente ya contratada.
 * Se ofrece en Ayuda → Guía y en la ventana "Cómo funciona" de la sección.
 */
export const TALENT_TOUR_STEPS: TourStep[] = [
  {
    route: '/talento',
    target: 'nav:/talento',
    title: 'Talento: la gente ya contratada',
    body: 'Reclutamiento termina cuando alguien es contratado; Talento sigue a esa persona después. Tiene dos pantallas: la Matriz 9-Box (dónde está cada colaborador según su desempeño y su cultura) y Acciones RR.HH. (qué hacer con cada quien). Los datos entran por las plantillas estándar de Colaboradores, KPIs de Desempeño y Cultura 360°; en la demo son de ejemplo.',
  },
  {
    route: '/talento',
    target: 'talent:matrix',
    title: '1. La Matriz 9-Box',
    body: 'Cada punto es una persona. Hacia la derecha, mejor desempeño (ventas, KPIs); hacia arriba, mejor cultura y potencial (evaluación 360°). Ambos en escala de 1 a 5. Arriba a la derecha están Superestrella, Estrella y Futuro Líder; abajo a la izquierda, Crítico o Inadecuado; en medio, quienes necesitan desarrollo. El cuadrante se calcula solo con los puntajes. Toca un punto para abrir el perfil.',
  },
  {
    route: '/talento',
    target: 'talent:filter',
    title: 'Filtra por departamento',
    body: 'Elige un departamento y la matriz, la lista de colaboradores y la Cultura 360° del equipo muestran solo a esa área. "Todos" vuelve a la empresa completa.',
  },
  {
    route: '/talento',
    target: 'talent:list',
    title: '2. El perfil de cada persona',
    body: 'La lista muestra desempeño · cultura y el cuadrante de cada quien. Al tocar un nombre se abre su perfil: Desempeño, Cultura, eNPS y cuadrante; el historial de los últimos 6 trimestres con semáforo; la decisión sugerida de RR.HH.; sus 10 dimensiones de Cultura 360°; y la recomendación de crecimiento con los 7 Hábitos, que se envía por WhatsApp a la persona y a su jefe.',
  },
  {
    route: '/talento',
    target: 'talent:culture',
    title: 'Cultura 360° del equipo',
    body: 'Promedio del equipo (o del departamento filtrado) en las 10 dimensiones de la evaluación 360°, en 3 grupos: Liderazgo (claridad, inspiración, empoderamiento, integridad), Comunicación y Soporte (feedback, trabajo en equipo, transparencia, mentoring) e Inteligencia Emocional (emocional, resolución de conflictos). Verde desde 4.0, ámbar desde 3.0, rojo abajo.',
  },
  {
    route: '/acciones',
    target: 'actions:summary',
    title: '3. Acciones RR.HH.: qué hacer con cada quien',
    body: 'Cada trimestre tiene un semáforo (promedio de desempeño y cultura: verde desde 3.6, rojo abajo de 2.5, amarillo en medio). Según cuántos trimestres seguidos lleva la persona en ese color, la app sugiere la acción: en verde, reconocimiento, bono, premio o aumento/ascenso; en amarillo, seguimiento o capacitación; en rojo, carta de advertencia, suspensión o recomendación de desvinculación. Son reglas fijas y auditables, sin IA; cada tarjeta dice su "Base".',
  },
  {
    route: '/acciones',
    target: 'actions:list',
    title: 'Marca lo que ya hiciste',
    body: 'Las acciones se agrupan por prioridad: Atención / riesgo, Reconocer / premiar y Seguimiento. "Ver perfil" abre a la persona; "Marcar hecha" la pasa a Completadas (y "Reabrir" la devuelve). La decisión final es de RR.HH.: la app solo la sugiere. En la demo, lo marcado se olvida al recargar.',
  },
  {
    route: '/acciones',
    target: 'actions:reports',
    title: '4. Reportes a gerentes',
    body: 'Una tarjeta por departamento con su gerente y cuántas personas tiene a reconocer, en seguimiento y en riesgo. "Ver / enviar reporte" arma el resumen con cada caso y su base, y lo mandas al gerente por WhatsApp, lo copias o lo descargas como texto.',
  },
  {
    route: '/acciones',
    target: 'help:launcher',
    title: '¿Dudas sobre Talento?',
    body: 'En Ayuda → Chat pregunta, por ejemplo, "¿qué significa Diamante en Bruto?" o "¿cómo se decide un aumento?". En Guía repites este recorrido y en Video está el video de Talento.',
  },
];

/**
 * Recorrido de la sección Gestión (Métricas RR.HH. y Configuración): medir cuánto tarda
 * cada quien y ajustar equipo, metas y módulos.
 */
export const MANAGEMENT_TOUR_STEPS: TourStep[] = [
  {
    route: '/metricas',
    target: 'metrics:filters',
    title: 'Gestión: medir y ajustar',
    body: 'Gestión tiene dos pantallas: Métricas RR.HH., que mide cuánto tarda cada persona del equipo en hacer lo suyo, y Configuración, donde se definen el equipo, las metas en días y los módulos opcionales. Es para el propio departamento, no para la gerencia. Estos filtros (vacante y persona) aplican a toda la pantalla de métricas.',
  },
  {
    route: '/metricas',
    target: 'metrics:kpis',
    title: '1. Los cuatro números del equipo',
    body: 'Revisar un CV (desde que llega), Responder al candidato (desde que se revisó), Contratar (time-to-hire desde que aplicó; time-to-fill desde que se abrió la vacante) y Pendientes fuera de meta. Cada uno se compara con su meta: verde dentro, ámbar hasta 1.5 veces la meta, rojo después.',
  },
  {
    route: '/metricas',
    target: 'metrics:people',
    title: '2. Cada quien',
    body: 'Una fila por persona del equipo de RR.HH.: candidatos asignados y activos, días promedio para revisar, responder y llegar a la entrevista (con el % a tiempo), entrevistas, ofertas, contrataciones, time-to-hire y cuántos pendientes tiene (revisar o responder). La gráfica compara a las personas.',
  },
  {
    route: '/metricas',
    target: 'metrics:stages',
    title: '3. Tiempo por etapa y embudo',
    body: 'Las 5 etapas del proceso con su promedio y su meta (la marca vertical): revisar, responder, entrevistar, decidir y cerrar. La etapa más pasada de su meta se señala como cuello de botella. Al lado, el embudo: de cuántos CVs recibidos cuántos se revisaron, respondieron, entrevistaron, recibieron oferta y se contrataron.',
  },
  {
    route: '/metricas',
    target: 'metrics:jobs',
    title: 'Por vacante',
    body: 'Cada vacante con sus días abierta, candidatos recibidos y activos, cuánto se tarda en revisar sus CVs, plazas cubiertas (contratados sobre plazas) y time-to-fill.',
  },
  {
    route: '/metricas',
    target: 'metrics:pending',
    title: '4. Pendientes por persona',
    body: 'La lista de trabajo del día: qué falta hacer (revisar un CV, responder, decidir tras la entrevista, cerrar la oferta o pedir un CV legible), con quién, el responsable y cuántos días lleva esperando contra la meta. "Fuera de meta" es lo urgente.',
  },
  {
    route: '/configuracion',
    target: 'settings:team',
    title: '5. Equipo de RR.HH.',
    body: 'Las personas que aparecen en "Cada quien". Reynaldo y Jessica vienen de base; agrega a alguien con su nombre y cargo y quítalo con el basurero (solo a quienes agregaste). Nada más tiene usuarios ni contraseñas en la demo.',
  },
  {
    route: '/configuracion',
    target: 'settings:goals',
    title: '6. Metas de servicio',
    body: 'Los días máximos para cada etapa: revisar el CV, responder, entrevistar, decidir tras la entrevista y cerrar la oferta (entre 1 y 60). Definen el semáforo y los pendientes fuera de meta en Métricas y en el Dashboard, y se aplican al instante. "Restablecer" vuelve a las de fábrica: 2, 1, 5, 3 y 5 días.',
  },
  {
    route: '/configuracion',
    target: 'settings:modules',
    title: '7. Módulos opcionales',
    body: 'El catálogo es fijo: la empresa solo enciende o apaga. Hoy el único módulo es Entrevistas IA por videollamada. Al activarlo se abre su ayuda guiada y aparece en el menú de Reclutamiento; al apagarlo solo se oculta, no se pierde nada.',
  },
  {
    route: '/configuracion',
    target: 'settings:questions',
    title: '8. Preguntas al chat de ayuda',
    body: 'Todo lo que preguntas en el botón Ayuda queda aquí, con fecha, pantalla y si tuvo respuesta ("Sin respuesta" es lo que falta en la guía). "Enviar a Oscar" abre un correo con la lista y espacio para tus comentarios; también puedes copiarla, descargarla o borrarla.',
  },
  {
    route: '/configuracion',
    target: 'settings:reset',
    title: 'Restablecer la demo',
    body: 'TALENTIA es software opinado: el proceso ya viene definido y aquí solo se decide quién está en el equipo, qué tan rápido se atiende cada etapa y qué módulos están encendidos. Si quieres empezar de cero, este botón borra lo guardado en este navegador (vacantes creadas, CVs cargados, mensajes, evaluaciones, metas, equipo, módulos y preguntas).',
  },
];

/**
 * Recorrido guiado de Entrevistas IA por videollamada: se ofrece en la ventana que
 * se abre al activar el módulo en Configuración y se repite desde Ayuda → Guía.
 */
export const INTERVIEWS_AI_TOUR_STEPS: TourStep[] = [
  {
    route: '/configuracion',
    target: 'settings:module:interviewsAi',
    title: 'Módulo activado',
    body: 'Desde aquí lo enciendes o lo apagas cuando quieras. Apagarlo solo lo oculta del menú: no se pierde nada. Este recorrido te enseña cómo funciona y qué te toca hacer a ti.',
  },
  {
    route: '/configuracion',
    target: 'nav:/entrevistas',
    title: 'Nueva sección en el menú',
    body: '"Entrevistas IA" aparece en Reclutamiento, después de Respuestas a CVs y Entrevistas, porque ese es su lugar en el proceso: primero agendas la entrevista y luego el asistente de IA la hace.',
  },
  {
    route: '/vacantes',
    target: 'jobs:guide',
    title: '1. La guía de cada vacante',
    body: 'El asistente de IA hace las preguntas de la guía de competencias de RR.HH. (Vendedor o Jefe de Tienda), en orden y sin improvisar: las mismas que haría una persona. La guía se deduce del título de la vacante y la tarjeta la muestra; las "preguntas extra" del formulario son opcionales para el entrevistador.',
  },
  {
    route: '/respuestas',
    target: 'reply:ai-notice',
    title: '2. Agenda con el aviso de IA',
    body: 'Con el módulo activo aparece esta casilla: déjala marcada y el mensaje avisa al candidato que lo entrevistará el asistente de IA y que la entrevista se grabará. Desmárcala si la entrevista la hará una persona del equipo.',
  },
  {
    route: '/entrevistas',
    target: 'interviews:channels',
    title: '3. El asistente entrevista por videollamada',
    body: 'A la hora acordada entra a la videollamada de Zoom, se presenta como asistente virtual con IA y hace las preguntas una por una; todo queda transcrito. La videollamada real está planeada para la Fase 3.',
  },
  {
    route: '/entrevistas',
    target: 'interviews:start',
    title: '4. Pruébalo aquí',
    body: 'En la demo la videollamada se simula con un chat: elige un candidato, pulsa "Iniciar entrevista" y escribe las respuestas como lo haría el candidato. Quien confirma su entrevista en Respuestas a CVs aparece en la lista.',
  },
  {
    route: '/entrevistas',
    target: 'interviews:evaluation',
    title: '5. La transcripción y la sugerencia',
    body: 'Al terminar, cada respuesta queda anotada bajo su pregunta y las opciones múltiples ya marcadas, como borrador en Entrevistas. Aquí ves la sugerencia preliminar de la IA (1 a 5 por pregunta, con la escala de la guía) y las diferencias entre el CV y lo que dijo. En la demo la sugerencia es aproximada.',
  },
  {
    route: '/competencias',
    target: 'competencias:list',
    title: '6. RR.HH. puntúa y decide',
    body: 'En Entrevistas abres al candidato ("Puntuar en Entrevistas"), lees la transcripción, puntúas de 1 a 5 y la app calcula el Índice General y la recomendación. La IA no contrata ni descarta a nadie: tú decides si pasa a Oferta o se descarta, al final del reporte.',
  },
  {
    route: '/entrevistas',
    target: 'help:launcher',
    title: '¿Dudas sobre Entrevistas IA?',
    body: 'En Ayuda → Chat pregunta, por ejemplo, "¿cómo funciona la entrevista por videollamada?". En Guía repites este recorrido y en Video está el video de este módulo.',
  },
];

export const TOURS: Record<TourId, TourStep[]> = {
  main: TOUR_STEPS,
  talent: TALENT_TOUR_STEPS,
  management: MANAGEMENT_TOUR_STEPS,
  interviewsAi: INTERVIEWS_AI_TOUR_STEPS,
};

/** Nombre corto que la tarjeta del tour muestra junto al número de paso. */
export const TOUR_LABELS: Record<TourId, string> = {
  main: 'Tour',
  talent: 'Talento',
  management: 'Gestión',
  interviewsAi: 'Entrevistas IA',
};

export function isTourId(x: unknown): x is TourId {
  return typeof x === 'string' && x in TOURS;
}

// ---------- Videos de ayuda ----------

export type HelpVideoId = 'tour' | 'talent' | 'management' | 'interviewsAi';

export interface HelpVideo {
  id: HelpVideoId;
  /** Nombre en el selector de la pestaña Video. */
  tab: string;
  title: string;
  description: string;
  mp4: string;
  webm: string;
  /** Capítulos (segundos aproximados). */
  chapters: { t: number; label: string }[];
}

const asset = (file: string) => `${import.meta.env.BASE_URL}ayuda/${file}`;

/** Capítulos del video de recorrido (segundos aproximados). */
export const VIDEO_CHAPTERS: { t: number; label: string }[] = [
  { t: 0, label: 'Qué es TALENTIA y el orden del trabajo' },
  { t: 27, label: 'Crear la vacante con IA (5 pasos)' },
  { t: 74, label: 'Subir CVs y ver el ranking' },
  { t: 105, label: 'Responder: Zoom y un horario por candidato' },
  { t: 148, label: 'Seguir candidatos por etapa' },
  { t: 155, label: 'Métricas: cuánto tarda cada quien' },
  { t: 177, label: 'Configuración: equipo, metas y módulos' },
  { t: 195, label: 'El botón de ayuda' },
];

/** Capítulos del video de Entrevistas IA por videollamada (segundos aproximados). */
export const INTERVIEWS_AI_VIDEO_CHAPTERS: { t: number; label: string }[] = [
  { t: 0, label: 'Qué es Entrevistas IA por videollamada' },
  { t: 15, label: 'Activar el módulo en Configuración' },
  { t: 36, label: 'Preguntas de la vacante' },
  { t: 50, label: 'Agendar por Zoom con el aviso de IA' },
  { t: 69, label: 'La entrevista por videollamada' },
  { t: 77, label: 'Probarla en la demo' },
  { t: 89, label: 'Leer la evaluación' },
  { t: 103, label: 'RR.HH. decide' },
  { t: 112, label: 'Dónde pedir ayuda' },
];

/** Capítulos del video de Talento (segundos aproximados). */
export const TALENT_VIDEO_CHAPTERS: { t: number; label: string }[] = [
  { t: 0, label: 'Qué es Talento' },
  { t: 13, label: 'La Matriz 9-Box y sus cuadrantes' },
  { t: 32, label: 'Filtrar por departamento' },
  { t: 40, label: 'El perfil: historial y decisión sugerida' },
  { t: 54, label: 'Cultura 360°: las 10 dimensiones' },
  { t: 66, label: 'Recomendación de crecimiento (7 Hábitos)' },
  { t: 80, label: 'Acciones RR.HH.: las reglas' },
  { t: 106, label: 'Marcar hecha' },
  { t: 117, label: 'Reportes a gerentes' },
  { t: 128, label: 'Dónde pedir ayuda' },
];

/** Capítulos del video de Gestión (segundos aproximados). */
export const MANAGEMENT_VIDEO_CHAPTERS: { t: number; label: string }[] = [
  { t: 0, label: 'Qué es Gestión' },
  { t: 14, label: 'Filtros y los cuatro números' },
  { t: 33, label: 'Cada quien' },
  { t: 49, label: 'Tiempo por etapa, embudo y por vacante' },
  { t: 65, label: 'Pendientes por persona' },
  { t: 76, label: 'Configuración: equipo de RR.HH.' },
  { t: 85, label: 'Metas de servicio' },
  { t: 95, label: 'Módulos opcionales' },
  { t: 105, label: 'Preguntas al chat de ayuda' },
  { t: 113, label: 'Restablecer la demo' },
  { t: 129, label: 'Dónde pedir ayuda' },
];

export const HELP_VIDEOS: HelpVideo[] = [
  {
    id: 'tour',
    tab: 'Recorrido',
    title: 'Recorrido completo de TALENTIA',
    description: 'Recorrido completo de TALENTIA (3 min y medio), narrado y con subtítulos. Toca un capítulo para ir directo.',
    mp4: asset('tour-talentia.mp4'),
    webm: asset('tour-talentia.webm'),
    chapters: VIDEO_CHAPTERS,
  },
  {
    id: 'talent',
    tab: 'Talento',
    title: 'Talento: Matriz 9-Box y Acciones RR.HH.',
    description: 'La gente ya contratada: la Matriz 9-Box, el perfil de cada persona, las acciones sugeridas y los reportes a gerentes (2 min y medio), narrado y con subtítulos. Toca un capítulo para ir directo.',
    mp4: asset('talento.mp4'),
    webm: asset('talento.webm'),
    chapters: TALENT_VIDEO_CHAPTERS,
  },
  {
    id: 'management',
    tab: 'Gestión',
    title: 'Gestión: Métricas RR.HH. y Configuración',
    description: 'Cuánto tarda cada quien, los pendientes fuera de meta y cómo se ajustan equipo, metas y módulos (2 min y medio), narrado y con subtítulos. Toca un capítulo para ir directo.',
    mp4: asset('gestion.mp4'),
    webm: asset('gestion.webm'),
    chapters: MANAGEMENT_VIDEO_CHAPTERS,
  },
  {
    id: 'interviewsAi',
    tab: 'Entrevistas IA',
    title: 'Entrevistas IA por videollamada',
    description: 'Cómo se activa, cómo funciona y qué te toca hacer (2 min), narrado y con subtítulos. Toca un capítulo para ir directo.',
    mp4: asset('entrevistas-ia.mp4'),
    webm: asset('entrevistas-ia.webm'),
    chapters: INTERVIEWS_AI_VIDEO_CHAPTERS,
  },
];

export function helpVideo(id: HelpVideoId): HelpVideo {
  return HELP_VIDEOS.find((v) => v.id === id) ?? HELP_VIDEOS[0];
}
