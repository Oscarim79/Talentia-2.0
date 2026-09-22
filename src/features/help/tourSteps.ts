/** Pasos del tour guiado: en qué pantalla, qué elemento se resalta y qué se explica. */
export interface TourStep {
  route: string;
  /** Valor de `data-tour` del elemento a resaltar (opcional: sin él, solo se muestra la tarjeta). */
  target?: string;
  title: string;
  body: string;
}

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
    body: 'Todo empieza aquí. "Nueva vacante" abre un asistente de 5 pasos: datos básicos y marca (Americana, Abiq o Friotec), descripción con IA, los filtros con los que la IA puntuará los CVs, preguntas de entrevista y revisión. Al final puedes descargar el XML para LinkedIn.',
  },
  {
    route: '/screening',
    target: 'screening:dropzone',
    title: '2. Sube los CVs',
    body: 'Elige la vacante y arrastra los CVs (PDF, Word o imagen) a esta zona. La IA lee cada uno, lo puntúa de 0 a 100 contra los filtros de la vacante y los ordena. Verás la evidencia textual de cada requisito y, aparte, los archivos que no se pudieron leer.',
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
    body: 'Con un clic se envía a cada seleccionado el mensaje estándar (WhatsApp o correo) con dos opciones de horario. La Bandeja de envíos de abajo te dice quién confirmó y quién no contestó. La regla automática puede hacer esto sola para todo CV que supere el score que definas.',
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
    body: 'En Configuración defines las metas en días, agregas personas al equipo de RR.HH. y enciendes módulos opcionales como Entrevistas IA. Nada más se configura: el proceso ya viene definido.',
  },
  {
    route: '/configuracion',
    target: 'help:launcher',
    title: '¿Dudas? Pregunta aquí',
    body: 'Este botón siempre está disponible. Tiene un chat de ayuda que responde cómo hacer cada cosa y te lleva a la pantalla correcta, la guía para repetir este tour y un video corto con el recorrido completo.',
  },
];

/** Capítulos del video de recorrido (segundos aproximados). */
export const VIDEO_CHAPTERS: { t: number; label: string }[] = [
  { t: 0, label: 'Qué es TALENTIA y el orden del trabajo' },
  { t: 11, label: 'Crear la vacante con IA (5 pasos)' },
  { t: 33, label: 'Subir CVs y ver el ranking' },
  { t: 48, label: 'Filtrar y responder para agendar entrevista' },
  { t: 66, label: 'Seguir candidatos por etapa' },
  { t: 71, label: 'Métricas: cuánto tarda cada quien' },
  { t: 83, label: 'Configuración: equipo, metas y módulos' },
  { t: 91, label: 'El botón de ayuda' },
];
