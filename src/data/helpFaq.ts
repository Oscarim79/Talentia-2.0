// ============================================================
//  Base de conocimiento de la ayuda (preguntas frecuentes).
//  Demo: el chat de ayuda responde con esto (búsqueda por palabras clave).
//  Producción: se entrega como contexto al LLM (Claude) para respuestas libres.
// ============================================================

export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  /** Ruta a la que conviene ir para hacerlo. */
  route?: string;
  routeLabel?: string;
}

export const HELP_FAQ: FaqEntry[] = [
  {
    id: 'flujo',
    question: '¿Cómo funciona TALENTIA en general?',
    keywords: ['flujo', 'proceso', 'general', 'empezar', 'inicio', 'como funciona', 'que hace', 'pasos'],
    answer:
      'El proceso siempre es el mismo, en este orden: 1) creas la vacante en Vacantes, 2) subes los CVs en Screening IA y la IA los puntúa, 3) en Respuestas a CVs filtras los mejores y les mandas el mensaje para agendar entrevista, 4) en Candidatos sigues a cada persona por etapa, y 5) en Métricas RR.HH. ves cuánto tarda cada quien. Puedes ver el tour guiado desde el botón de ayuda.',
    route: '/',
    routeLabel: 'Ir al Dashboard',
  },
  {
    id: 'vacante',
    question: '¿Cómo creo una vacante?',
    keywords: ['vacante', 'plaza', 'puesto', 'crear vacante', 'nueva vacante', 'publicar', 'linkedin', 'marca'],
    answer:
      'Ve a Vacantes y pulsa "Nueva vacante". El asistente tiene 5 pasos: básicos (título, marca Americana/Abiq/Friotec, plazas, salario), descripción generada con IA, filtros de screening (los criterios con los que la IA puntuará los CVs), preguntas de entrevista y revisión. Al final puedes descargar el XML para publicar en LinkedIn.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    id: 'filtros',
    question: '¿Qué son los filtros de screening?',
    keywords: ['filtro', 'criterio', 'requisito', 'positivo', 'negativo', 'excluyente', 'puntuar', 'score'],
    answer:
      'Son los requisitos de la vacante. Los positivos suman puntos cuando el CV los cumple (ej. "Ventas", "Gestión de tienda"); los negativos son excluyentes (ej. "Sin disponibilidad de fines de semana") y bajan el score. El score va de 0 a 100: verde desde 80, ámbar desde 60, rojo abajo.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    id: 'subir-cv',
    question: '¿Cómo subo los CVs?',
    keywords: ['subir', 'cargar', 'cv', 'cvs', 'curriculum', 'pdf', 'arrastrar', 'screening', 'lote', 'archivo'],
    answer:
      'En Screening IA elige la vacante y arrastra los archivos (PDF, Word o imagen) a la zona punteada, o pulsa para elegirlos. La IA lee cada CV, lo puntúa contra los filtros de la vacante y los ordena de mejor a peor, con la evidencia textual de cada requisito. Los CVs que no se pudieron leer quedan en la pestaña "Errores".',
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    id: 'errores-cv',
    question: 'Un CV salió en la cola de errores, ¿qué hago?',
    keywords: ['error', 'ilegible', 'escaneado', 'contraseña', 'password', 'no se pudo leer', 'corrupto'],
    answer:
      'Significa que el archivo no se pudo leer: suele ser un PDF escaneado como imagen, protegido con contraseña o dañado. Pídele al candidato una versión legible (PDF exportado de Word, no foto). En Respuestas a CVs y en Métricas aparece como pendiente "CV ilegible: pedir versión legible".',
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    id: 'responder',
    question: '¿Cómo respondo a los candidatos para agendar entrevista?',
    keywords: ['responder', 'respuesta', 'mensaje', 'whatsapp', 'correo', 'email', 'agendar', 'entrevista', 'citar', 'horario', 'plantilla'],
    answer:
      'En Respuestas a CVs filtra por vacante y score mínimo, marca a los candidatos y pulsa "Responder a N seleccionados". El mensaje es una plantilla estándar: tú solo eliges canal (WhatsApp o correo), modalidad, dos opciones de horario, indicaciones y firma; el nombre, la vacante y la marca se completan solos. Puedes ver la vista previa con el ojito antes de enviar.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'regla',
    question: '¿Qué es la regla automática?',
    keywords: ['regla', 'automatico', 'automática', 'umbral', 'solo', 'apenas', 'automatizar'],
    answer:
      'Con la regla activa, TALENTIA responde sola a todo CV que supere el score que tú definas (por ejemplo 70) apenas termina el screening, sin que tengas que seleccionarlo. "Ejecutar ahora" la aplica de inmediato a los pendientes. Puedes apagarla cuando quieras.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'bandeja',
    question: '¿Cómo sé si el candidato confirmó la entrevista?',
    keywords: ['bandeja', 'confirmo', 'confirmó', 'contesto', 'contestó', 'sin respuesta', 'reenviar', 'estado', 'enviado'],
    answer:
      'En la Bandeja de envíos (abajo en Respuestas a CVs) cada mensaje pasa por Enviando → Enviado → Entrevista agendada (con el horario que eligió) o Sin respuesta. A quien no contestó le puedes reenviar el mensaje marcándolo de nuevo.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'etapas',
    question: '¿Qué significan las etapas de Candidatos?',
    keywords: ['etapa', 'etapas', 'candidatos', 'pipeline', 'tablero', 'aplicado', 'oferta', 'contratado', 'descartado', 'kanban'],
    answer:
      'Aplicados: llegó el CV y nadie lo ha revisado. Screening: ya fue revisado y puntuado. Entrevista: tiene entrevista agendada o hecha. Oferta: se le envió oferta. Contratados y Descartados cierran el proceso. Cada tarjeta muestra el score de la IA.',
    route: '/candidatos',
    routeLabel: 'Ir a Candidatos',
  },
  {
    id: 'metricas',
    question: '¿Qué mide Métricas RR.HH.?',
    keywords: ['metrica', 'métrica', 'metricas', 'métricas', 'tiempo', 'tarda', 'cada quien', 'productividad', 'time to hire', 'time-to-fill', 'semaforo', 'semáforo'],
    answer:
      'Cuánto tarda cada persona del equipo en hacer lo suyo: revisar un CV, responder al candidato, entrevistar, decidir y cerrar la oferta, comparado con la meta de cada etapa (verde dentro de la meta, ámbar hasta 1.5 veces, rojo después). También muestra el embudo, la cobertura de plazas por vacante y la lista de pendientes fuera de meta con su responsable.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
  },
  {
    id: 'metas',
    question: '¿Cómo cambio las metas de servicio?',
    keywords: ['meta', 'metas', 'sla', 'dias', 'días', 'objetivo', 'cambiar meta', 'editar meta'],
    answer:
      'En Configuración → Metas de servicio. Son cinco números en días (revisar, responder, entrevistar, decidir, cerrar). Se aplican al instante en Métricas y en el Dashboard, y "Restablecer" vuelve a los valores de fábrica (2, 1, 5, 3 y 5 días).',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  {
    id: 'equipo',
    question: '¿Cómo agrego a alguien del equipo de RR.HH.?',
    keywords: ['equipo', 'agregar persona', 'usuario', 'reclutador', 'asistente', 'jefe', 'quitar', 'miembro'],
    answer:
      'En Configuración → Equipo de RR.HH. escribe el nombre y el cargo y pulsa Agregar. La persona aparece de inmediato en "Cada quien" de Métricas. Las personas base (Reynaldo y Jessica) no se pueden quitar desde ahí.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  {
    id: 'entrevistas-ia',
    question: '¿Dónde está Entrevistas IA?',
    keywords: ['entrevistas ia', 'agente', 'modulo', 'módulo', 'activar', 'desactivado', 'chat entrevista'],
    answer:
      'Es un módulo opcional y viene apagado. En Configuración → Módulos opcionales enciende "Entrevistas IA" y aparecerá en el menú de Reclutamiento: un agente conversacional entrevista al candidato con las preguntas de la vacante y lo evalúa.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  {
    id: 'talento',
    question: '¿Para qué sirve la Matriz 9-Box?',
    keywords: ['9-box', '9 box', 'nine', 'talento', 'matriz', 'cultura', 'desempeño', 'colaborador', 'acciones'],
    answer:
      'Es el módulo de Talento para la gente ya contratada: cruza desempeño y cultura/potencial en 9 cuadrantes, guarda el historial por trimestre y propone acciones de RR.HH. (reconocimiento, capacitación, seguimiento). Acciones RR.HH. agrupa esas decisiones para todo el equipo.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
  },
  {
    id: 'demo',
    question: '¿Los datos son reales?',
    keywords: ['demo', 'datos', 'real', 'reales', 'prueba', 'simulado', 'mock', 'guardar', 'persistencia'],
    answer:
      'Ahora la app corre en modo demostración: los datos son de ejemplo y la IA está simulada. Lo que configures (metas, equipo, módulos) se guarda en este navegador. La conexión a datos reales y a la IA de verdad se activa después de la aprobación.',
  },
  {
    id: 'tour',
    question: '¿Cómo vuelvo a ver el tour o el video?',
    keywords: ['tour', 'video', 'guia', 'guía', 'tutorial', 'ayuda', 'aprender', 'capacitacion', 'capacitación'],
    answer:
      'Desde el botón de ayuda (abajo a la derecha): la pestaña "Guía" inicia el tour paso a paso por las pantallas y la pestaña "Video" tiene el recorrido narrado de 3 minutos con capítulos.',
  },
];
