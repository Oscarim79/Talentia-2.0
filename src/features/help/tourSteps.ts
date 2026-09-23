import type { ModuleId } from '../../core/modules';

/** Pasos del tour guiado: en qué pantalla, qué elemento se resalta y qué se explica. */
export interface TourStep {
  route: string;
  /** Valor de `data-tour` del elemento a resaltar (opcional: sin él, solo se muestra la tarjeta). */
  target?: string;
  title: string;
  body: string;
}

/** Tour general de la app o ayuda guiada de un módulo opcional. */
export type TourId = 'main' | ModuleId;

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    target: 'nav:/',
    title: 'Bienvenido a TALENTIA',
    body: 'El menú de la izquierda sigue el orden real del trabajo: Reclutamiento (vacante → CVs → respuestas → candidatos), Talento (la gente ya contratada) y Gestión (métricas y configuración). Este tour te lleva por cada paso.',
  },
  {
    route: '/vacantes',
    target: 'jobs:new',
    title: '1. Crea la vacante',
    body: 'Todo empieza aquí. "Nueva vacante" abre un formulario de 5 pasos: datos básicos y marca (Americana, Abiq o Friotec), descripción con IA, los filtros con los que la IA puntuará los CVs, preguntas de entrevista y revisión. Al final puedes descargar el XML para LinkedIn.',
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
    route: '/candidatos',
    target: 'candidates:board',
    title: '5. Sigue a cada candidato',
    body: 'El tablero muestra a cada persona en su etapa: Aplicados, Screening, Entrevista, Oferta, Contratados y Descartados. Cada tarjeta lleva el score de la IA.',
  },
  {
    route: '/metricas',
    target: 'metrics:people',
    title: '6. Mide cuánto tarda cada quien',
    body: 'Métricas RR.HH. muestra, por persona, cuánto tarda en revisar un CV, responder, entrevistar y cerrar, contra la meta de cada etapa (verde, ámbar, rojo), más los pendientes fuera de meta con su responsable.',
  },
  {
    route: '/configuracion',
    target: 'settings:goals',
    title: '7. Ajusta metas y equipo',
    body: 'En Configuración defines las metas en días, agregas personas al equipo de RR.HH. y enciendes módulos opcionales como Entrevistas IA por videollamada (al activarlo, se abre una ayuda guiada que explica cómo funciona). Nada más se configura: el proceso ya viene definido.',
  },
  {
    route: '/configuracion',
    target: 'help:launcher',
    title: '¿Dudas? Pregunta aquí',
    body: 'Este botón siempre está disponible. Tiene un chat de ayuda que responde cómo hacer cada cosa y te lleva a la pantalla correcta, la guía para repetir este tour y los videos con el recorrido completo.',
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
    body: '"Entrevistas IA" aparece en Reclutamiento, después de Respuestas a CVs, porque ese es su lugar en el proceso: primero agendas la entrevista y luego el asistente de IA la hace.',
  },
  {
    route: '/vacantes',
    target: 'jobs:questions',
    title: '1. Revisa las preguntas de la vacante',
    body: 'El asistente de IA solo hace las preguntas del banco de la vacante, en orden, y no improvisa. Se definen al crear la vacante (paso 4, "Preguntas IA") y hoy no se editan después; la tarjeta dice cuántas tiene. Si una vacante no tiene, usa 3 generales.',
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
    title: '5. Lee la evaluación',
    body: 'Al terminar aparecen el puntaje global de 0 a 100 (verde desde 80, ámbar desde 60, rojo abajo), el de 1 a 10 de cada pregunta y las diferencias entre el CV y lo que dijo el candidato. En la demo el puntaje es aproximado.',
  },
  {
    route: '/candidatos',
    target: 'candidates:board',
    title: '6. RR.HH. decide',
    body: 'La evaluación es una recomendación: la IA no contrata ni descarta a nadie. Tú decides si el candidato pasa a Oferta o se descarta. En la demo el tablero solo muestra la etapa (quien confirma su entrevista pasa solo a Entrevista).',
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
  interviewsAi: INTERVIEWS_AI_TOUR_STEPS,
};

/** Nombre corto que la tarjeta del tour muestra junto al número de paso. */
export const TOUR_LABELS: Record<TourId, string> = {
  main: 'Tour',
  interviewsAi: 'Entrevistas IA',
};

export function isTourId(x: unknown): x is TourId {
  return typeof x === 'string' && x in TOURS;
}

// ---------- Videos de ayuda ----------

export type HelpVideoId = 'tour' | 'interviewsAi';

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

export const HELP_VIDEOS: HelpVideo[] = [
  {
    id: 'tour',
    tab: 'Recorrido (3½ min)',
    title: 'Recorrido completo de TALENTIA',
    description: 'Recorrido completo de TALENTIA (3 min y medio), narrado y con subtítulos. Toca un capítulo para ir directo.',
    mp4: asset('tour-talentia.mp4'),
    webm: asset('tour-talentia.webm'),
    chapters: VIDEO_CHAPTERS,
  },
  {
    id: 'interviewsAi',
    tab: 'Entrevistas IA (2 min)',
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
