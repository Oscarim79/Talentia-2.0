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
    keywords: ['filtro', 'filtros', 'criterio', 'requisito', 'positivo', 'negativo', 'excluyente', 'puntuar', 'score'],
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
    keywords: ['error', 'errores', 'cola de errores', 'con error', 'ilegible', 'escaneado', 'contraseña', 'password', 'no se pudo leer', 'corrupto'],
    answer:
      'Significa que el archivo no se pudo leer: suele ser un PDF escaneado como imagen, protegido con contraseña o dañado. Pídele al candidato una versión legible (PDF exportado de Word, no foto). En Respuestas a CVs y en Métricas aparece como pendiente "CV ilegible: pedir versión legible".',
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    id: 'responder',
    question: '¿Cómo respondo a los candidatos para agendar entrevista?',
    keywords: ['responder', 'respondo', 'respuesta', 'mensaje', 'whatsapp', 'correo', 'email', 'agendar', 'agendo', 'entrevista', 'citar', 'horario', 'plantilla'],
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
    question: '¿Cómo activo las entrevistas por videollamada con IA?',
    keywords: ['como activo', 'como activar', 'como lo activo', 'como la activo', 'activo las entrevistas', 'activar las entrevistas', 'activo la entrevista', 'activar la entrevista', 'como enciendo', 'encender', 'habilitar', 'aparece', 'dónde está entrevistas', 'dónde están las entrevistas', 'módulo', 'entrevistas ia', 'entrevista ia', 'entrevistas con ia'],
    answer:
      'Es un módulo opcional y viene apagado. En Configuración → Módulos opcionales enciende "Entrevistas IA": aparece en el menú de Reclutamiento, después de Respuestas a CVs, y se abre una ayuda guiada que te explica cómo funciona y qué te toca hacer. Esa ayuda también está en el botón Ayuda → Guía.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  {
    id: 'entrevista-ia-como',
    question: '¿Cómo funciona la entrevista por videollamada con IA?',
    keywords: ['videollamada', 'video llamada', 'meet', 'cómo funciona la entrevista', 'funciona la entrevista', 'funciona la videollamada', 'videollamada con ia', 'asistente de ia', 'asistente ia', 'agente', 'entrevistador', 'entra a la llamada', 'transcribe', 'transcripción'],
    answer:
      'Agendas la entrevista como siempre desde Respuestas a CVs, con modalidad Videollamada. A la hora acordada, el asistente de IA entra a la videollamada, se presenta como asistente de entrevistas y hace una por una las preguntas del banco de la vacante; todo queda transcrito. Al terminar, en Entrevistas IA ves la evaluación: puntaje global, puntaje por pregunta y diferencias con el CV. La decisión es de RR.HH. En esta demo la videollamada todavía no está conectada: se simula con un chat.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
  },
  {
    id: 'entrevista-ia-pasos',
    question: '¿Qué tengo que hacer después de activar Entrevistas IA?',
    keywords: ['después de activar', 'al activar', 'ya lo activé', 'ya la activé', 'qué tengo que hacer', 'qué debo hacer', 'qué me toca', 'qué hago ahora', 'que activé', 'ya activé', 'primeros pasos'],
    answer:
      'Cinco cosas: 1) revisa que cada vacante abierta tenga sus preguntas de entrevista (la tarjeta de la vacante dice cuántas tiene); 2) al agendar en Respuestas a CVs deja la modalidad en Videollamada y avisa en "Indicaciones" que lo entrevistará el asistente de IA y que se grabará; 3) haz una entrevista de prueba en Entrevistas IA; 4) lee cada evaluación antes de decidir y confirma con el candidato cualquier diferencia con su CV; 5) si deciden no usarla, apágala en Configuración.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
  },
  {
    id: 'entrevista-ia-preguntas',
    question: '¿Qué preguntas hace el asistente de IA en la entrevista?',
    keywords: ['qué preguntas hace', 'qué pregunta', 'banco de preguntas', 'preguntas de entrevista', 'preguntas de la entrevista', 'preguntas de la vacante', 'preguntas ia', 'improvisa'],
    answer:
      'Solo las del banco de la vacante, en orden; no improvisa. Se definen al crear la vacante, en el paso 4 del asistente ("Preguntas IA"), generadas con IA o escritas a mano. La tarjeta de cada vacante dice cuántas tiene. Si una vacante no tiene preguntas, el asistente usa 3 generales: por qué le interesa el puesto, un logro del que se sienta orgulloso y su disponibilidad para empezar.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    id: 'entrevista-ia-aviso',
    question: '¿El candidato sabe que lo entrevista una IA? ¿Se graba?',
    keywords: ['sabe', 'sabe que', 'se presenta', 'avisar', 'aviso', 'consentimiento', 'graba', 'se graba', 'graba la entrevista', 'grabar', 'grabación', 'privacidad', 'robot', 'persona real'],
    answer:
      'Sí, siempre se le avisa. Al agendar en Respuestas a CVs, escribe en "Indicaciones" que lo entrevistará el asistente de IA de RR.HH. por videollamada y que la entrevista se grabará para evaluarla; al empezar, el asistente se presenta como asistente de entrevistas. Si el candidato prefiere hablar con una persona, agenda su entrevista con alguien del equipo.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'entrevista-ia-demo',
    question: '¿Cómo pruebo la entrevista IA en la demo?',
    keywords: ['cómo pruebo', 'pruebo', 'probar', 'probar la entrevista', 'pruebo la entrevista', 'probarla', 'probarlo', 'entrevista de prueba', 'simular', 'simulada', 'iniciar entrevista', 'chat de entrevista', 'reiniciar'],
    answer:
      'Abre Entrevistas IA, elige un candidato y pulsa "Iniciar entrevista". En la demo la videollamada se simula con un chat: el asistente saluda y hace las preguntas de la vacante, y tú escribes las respuestas como lo haría el candidato. Al terminar aparece la evaluación a la derecha. "Reiniciar" empieza de nuevo.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
  },
  {
    id: 'entrevista-ia-evaluacion',
    question: '¿Cómo leo la evaluación de la entrevista IA?',
    keywords: ['evaluación', 'la evaluación', 'evaluación de la entrevista', 'evalúa', 'puntaje global', 'puntaje', 'discrepancia', 'diferencias', 'resultado de la entrevista', 'calificación'],
    answer:
      'Al terminar la entrevista aparecen tres cosas: el puntaje global de 0 a 100 (verde desde 80: recomendado para avanzar a oferta; ámbar desde 60: evaluar con el equipo; rojo abajo: revisar con cuidado), el puntaje de 1 a 10 de cada pregunta y las discrepancias entre el CV y lo que dijo el candidato (por ejemplo, años de experiencia distintos). Es una recomendación: la decisión la toma RR.HH.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
  },
  {
    id: 'entrevista-ia-decide',
    question: '¿La IA decide si el candidato avanza o se descarta?',
    keywords: ['decide', 'decisión', 'quién decide', 'contrata sola', 'descarta sola', 'la ia contrata', 'la ia descarta', 'reemplaza'],
    answer:
      'No. El asistente entrevista y recomienda; la decisión siempre es de RR.HH. Lee la transcripción y la evaluación, confirma con el candidato cualquier diferencia con su CV y decide si pasa a Oferta o se descarta. El tablero de Candidatos muestra la etapa de cada persona.',
    route: '/candidatos',
    routeLabel: 'Ir a Candidatos',
  },
  {
    id: 'entrevista-ia-apagar',
    question: '¿Cómo desactivo Entrevistas IA?',
    keywords: ['desactivar', 'desactivo', 'desactivar entrevistas', 'desactivo entrevistas', 'apagar', 'apago', 'apagar entrevistas', 'apago entrevistas', 'apagar el módulo', 'desactivar el módulo', 'ocultar', 'quito', 'quito entrevistas', 'quitar entrevistas'],
    answer:
      'En Configuración → Módulos opcionales apaga el interruptor de Entrevistas IA. La sección se oculta del menú y no se pierde nada; puedes volver a encenderla cuando quieras y se abrirá otra vez la ayuda guiada.',
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
    id: 'comentarios',
    question: '¿Cómo envío mis comentarios o dudas a Oscar?',
    keywords: ['comentario', 'comentarios', 'sugerencia', 'enviar', 'oscar', 'retroalimentacion', 'retroalimentación', 'feedback', 'ronda', 'prueba', 'guion', 'guión'],
    answer:
      'Todo lo que preguntas aquí queda guardado. Ve a Configuración → "Preguntas al chat de ayuda" y pulsa "Enviar a Oscar": se abre un correo con tus preguntas y espacio para tus respuestas. El guion de la ronda de prueba (qué probar cada día) está en la pestaña Guía del botón de ayuda.',
    route: '/ronda-de-prueba',
    routeLabel: 'Ver la ronda de prueba',
  },
  {
    id: 'tour',
    question: '¿Cómo vuelvo a ver el tour o el video?',
    keywords: ['tour', 'video', 'el video', 'los videos', 'guia', 'guía', 'tutorial', 'ayuda', 'aprender', 'capacitacion', 'capacitación'],
    answer:
      'Desde el botón de ayuda (abajo a la derecha): la pestaña "Guía" inicia el tour paso a paso por las pantallas (y la ayuda guiada de Entrevistas IA) y la pestaña "Video" tiene el recorrido narrado de 3 minutos y el video de Entrevistas IA por videollamada, con capítulos.',
  },
];
