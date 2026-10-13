// ============================================================
//  Base de conocimiento de la ayuda (preguntas frecuentes).
//  Demo: el chat de ayuda responde con esto (búsqueda por palabras clave).
//  Producción: se entrega como contexto al LLM (Claude) para respuestas libres.
// ============================================================
import type { ModuleId } from '../core/modules';

export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  /** Ruta a la que conviene ir para hacerlo. */
  route?: string;
  routeLabel?: string;
  /** Módulo opcional al que pertenece: tiene prioridad cuando el chat se abre desde la ayuda de ese módulo. */
  topic?: ModuleId;
}

export const HELP_FAQ: FaqEntry[] = [
  {
    id: 'flujo',
    question: '¿Cómo funciona TALENTIA en general?',
    keywords: ['flujo', 'proceso', 'general', 'empezar', 'inicio', 'como funciona', 'que hace talentia', 'que hace la app', 'pasos'],
    answer:
      'El proceso siempre es el mismo, en este orden: 1) creas la vacante en Vacantes, 2) subes los CVs en Screening IA y la IA los puntúa, 3) en Respuestas a CVs filtras los mejores y les mandas el mensaje para agendar la entrevista, 4) en Entrevistas haces la entrevista con la guía de competencias y la app calcula el reporte, 5) en Candidatos sigues a cada persona por etapa, y 6) en Métricas RR.HH. ves cuánto tarda cada quien. Puedes ver el tour guiado desde el botón de ayuda.',
    route: '/',
    routeLabel: 'Ir al Dashboard',
  },
  {
    id: 'vacante',
    question: '¿Cómo creo una vacante?',
    keywords: ['vacante', 'plaza', 'puesto', 'crear vacante', 'nueva vacante', 'publicar', 'linkedin', 'marca'],
    answer:
      'Ve a Vacantes y pulsa "Nueva vacante". El formulario tiene 5 pasos: básicos (título, marca Americana/Abiq/Friotec, plazas, salario), descripción generada con IA, filtros de screening (los criterios con los que la IA puntuará los CVs), preguntas de entrevista y revisión. Al final puedes descargar el XML para publicar en LinkedIn.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    id: 'filtros',
    question: '¿Qué son los filtros de screening?',
    keywords: ['filtro', 'filtros', 'criterio', 'requisito', 'positivo', 'negativo', 'excluyente', 'puntuar', 'score', 'requisitos de la vacante'],
    answer:
      'Son los requisitos de la vacante. Los positivos suman puntos cuando el CV los cumple (ej. "Ventas", "Gestión de tienda"); los negativos son excluyentes (ej. "Sin disponibilidad de fines de semana") y bajan el score. El score va de 0 a 100: verde desde 80, ámbar desde 60, rojo abajo.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
  },
  {
    id: 'subir-cv',
    question: '¿Cómo subo los CVs?',
    keywords: [
      'subir', 'cargar', 'cargue', 'cargué', 'cv', 'cvs', 'curriculum', 'pdf', 'arrastrar', 'screening', 'lote', 'archivo',
      'cargo los', 'donde cargo',
    ],
    answer:
      'En Screening IA elige la vacante y arrastra los archivos (PDF, Word o imagen) a la zona punteada, o pulsa para elegirlos. La IA lee cada CV, lo puntúa contra los filtros de la vacante y los ordena de mejor a peor, con la evidencia textual de cada requisito. Los CVs quedan guardados en este navegador: siguen ahí cuando vuelves y aparecen en Respuestas a CVs y en Candidatos. Los que no se pudieron leer quedan en la pestaña "Errores".',
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    id: 'errores-cv',
    question: 'Un CV salió en la cola de errores, ¿qué hago?',
    keywords: ['error', 'errores', 'cola de errores', 'con error', 'ilegible', 'escaneado', 'contraseña', 'password', 'no se pudo leer', 'corrupto'],
    answer:
      'Significa que el archivo no se pudo leer: suele ser un PDF escaneado como imagen, protegido con contraseña o dañado. Pídele al candidato una versión legible (PDF exportado de Word, no foto). En Métricas aparece como pendiente "CV ilegible: pedir versión legible".',
    route: '/screening',
    routeLabel: 'Ir a Screening IA',
  },
  {
    id: 'responder',
    question: '¿Cómo respondo a los candidatos para agendar entrevista?',
    keywords: ['responder', 'respondo', 'respuesta', 'mensaje', 'whatsapp', 'correo', 'email', 'agendar', 'agendo', 'entrevista', 'citar', 'plantilla', 'zoom'],
    answer:
      'En Respuestas a CVs filtra por vacante y score mínimo, marca a los candidatos y pulsa "Responder a N seleccionados". El mensaje es la plantilla estándar: tú eliges canal (WhatsApp o correo), modalidad (Virtual por Zoom viene por defecto), la primera entrevista y cuánto dura cada una, indicaciones y firma. Cada candidato recibe su propia fecha y hora, y el nombre, la vacante y la marca se completan solos. Mira la vista previa con el ojito antes de enviar.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'horarios',
    question: '¿Cómo le pongo un horario distinto a cada candidato?',
    keywords: [
      'horario', 'horarios', 'hora', 'fecha', 'fecha y hora', 'cambiar horario', 'cambiar la hora', 'cambiar la fecha',
      'cuanto dura', 'dura cada', 'otro horario', 'horario distinto', 'cada candidato', 'agenda', 'duracion', 'dura',
    ],
    answer:
      'En Respuestas a CVs, en la tarjeta del mensaje eliges la primera entrevista (fecha y hora) y cuánto dura cada una: al marcar candidatos, cada uno recibe un horario seguido del anterior (después de las 5:00 p.m. pasa al siguiente día hábil). Para cambiar el de alguien, edita la fecha y hora en su fila; "Usar el de la agenda" lo regresa. El mensaje lleva un solo horario, así: "miércoles, 23 de septiembre, 10:00 a.m.".',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'regla',
    question: '¿Qué es la regla automática?',
    keywords: [
      'regla', 'automatico', 'automática', 'umbral', 'solo', 'apenas', 'automatizar', 'respondo automatico',
      'responder automatico', 'respuesta automatica',
    ],
    answer:
      'Con la regla activa, TALENTIA responde sola a todo CV que supere el score que tú definas (por ejemplo 70), sin que tengas que seleccionarlo, con horarios seguidos desde la primera entrevista. "Ejecutar ahora" la aplica de inmediato a los pendientes. Puedes apagarla cuando quieras.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  {
    id: 'bandeja',
    question: '¿Cómo sé si el candidato confirmó la entrevista?',
    keywords: [
      'bandeja', 'confirmo', 'confirmó', 'contesto', 'contestó', 'sin respuesta', 'reenviar', 'estado', 'enviado', 'confirmaron',
      'contestaron', 'no le llego', 'no contesto',
    ],
    answer:
      'En la Bandeja de envíos (abajo en Respuestas a CVs) cada mensaje pasa por Enviando → Enviado → Entrevista agendada (con su horario) o Sin respuesta. Quien confirma pasa a la etapa Entrevista en Candidatos. A quien no contestó le puedes reenviar el mensaje marcándolo de nuevo.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
  },
  // ---------- Entrevista por competencias (guía de RR.HH. para Vendedores y Jefes de Tienda) ----------
  // Palabras clave específicas ("competencias", "índice general", "reporte de la entrevista") para no robarle
  // preguntas a Entrevistas IA ("puntaje de la entrevista", "evaluación"). Correr `npm run check:help`.
  {
    id: 'competencias',
    question: '¿Cómo hago la entrevista con la guía de competencias?',
    keywords: [
      'guia de competencias', 'guia de entrevista', 'guia de la entrevista', 'entrevista por competencias', 'entrevistas por competencias',
      'competencias', 'hago la entrevista', 'hacer la entrevista', 'hacer una entrevista', 'hago una entrevista', 'durante la entrevista',
      'entrevista por zoom', 'evaluar la entrevista', 'evaluo la entrevista', 'evaluar una entrevista', 'evaluo una entrevista',
      'evaluar al candidato', 'evaluo al candidato', 'evaluar entrevista', 'tomar notas', 'tomo notas', 'anotar', 'anoto', 'notas',
      'preguntas conductuales', 'pregunta conductual', 'conductuales', 'conductual', 'historia', 'opcion multiple',
      'repreguntas', 'repregunta', 'busca', 'empezar la entrevista', 'entrevistar al candidato', 'entrevisto al candidato',
      'guia para vendedores', 'guia para jefes', 'guia del vendedor', 'guia de jefe', 'seccion entrevistas', 'en entrevistas',
      'evaluo a un candidato', 'evaluar a un candidato', 'evaluo a una candidata', 'despues de la entrevista',
    ],
    answer:
      'En Entrevistas elige al candidato (aparecen los que están en la etapa Entrevista) y pulsa "Empezar la entrevista". La guía depende del puesto: Vendedor (10 preguntas conductuales, 45 min) o Jefe de Tienda (12, 60 min). Son 3 pasos: 1) Entrevista: haces las preguntas en orden —conductuales, la historia y al final las de opción múltiple— y anotas frases textuales del candidato; debajo de cada pregunta dice qué evidencia buscar y arriba tienes las repreguntas neutrales. 2) Puntuar: al terminar das de 1 a 5 a cada respuesta. 3) Reporte: la app calcula cada competencia, el Índice General y la recomendación. Todo se guarda solo. "Imprimir guía" saca la guía en blanco en papel.',
    route: '/competencias',
    routeLabel: 'Ir a Entrevistas',
  },
  {
    id: 'competencias-puntaje',
    question: '¿Cómo se calcula el puntaje de la entrevista por competencias?',
    keywords: [
      'como se calcula', 'se calcula', 'calcula el puntaje', 'calcula la nota', 'indice general', 'el indice', 'pesos', 'peso de cada',
      'escala de 1 a 5', 'de 1 a 5', 'escala', 'recomendado con reservas', 'con reservas', 'no recomendado', 'recomendado',
      'minimos obligatorios', 'minimo obligatorio', 'minimos', 'baja un nivel', 'plural', 'hicimos', 'maximo 3', 'puntaje maximo',
      'puntaje de la competencia', 'puntaje por competencia', 'clave de puntuacion', 'cuanto vale', 'vale la opcion',
      'vale cada', 'porcentaje', 'por que salio no recomendado', 'leido como vendedor', 'como vendedor', 'peso tiene',
      'cada competencia', 'pesa cada',
    ],
    answer:
      'Cada respuesta conductual y cada criterio de la historia se puntúa de 1 a 5 (1 Insuficiente, 2 Débil, 3 Adecuado, 4 Bueno, 5 Excelente). Por competencia: (promedio conductual × 0.8) + (opción múltiple × 0.2); la opción múltiple vale 5, 3 o 1 según la clave de la guía. El Índice General suma cada competencia por su peso según el puesto (Vendedor: Cliente 30 %, Comunicación 20 %, Equipo 15 %, Problemas 15 %, Resultados 20 %; Jefe de Tienda agrega Liderazgo 25 %). Recomendación: 4.0 a 5.0 Recomendado; 3.0 a 3.9 Recomendado con reservas; menos de 3.0 No recomendado. Mínimos: una competencia debajo de 3.0 baja la recomendación un nivel, y la competencia crítica del puesto debajo de 2.5 lo deja No recomendado: Orientación al Cliente en vendedor y Liderazgo y Gestión en jefe de tienda. Si el candidato habló solo en plural sin decir qué hizo él, el máximo de esa respuesta es 3.',
    route: '/competencias',
    routeLabel: 'Ir a Entrevistas',
  },
  {
    id: 'competencias-reporte',
    question: '¿Cómo imprimo o comparto el reporte de la entrevista?',
    keywords: [
      'reporte de la entrevista', 'reporte de competencias', 'reporte del candidato', 'el reporte', 'imprimir', 'imprimo', 'impreso',
      'en pdf', 'guardar en pdf', 'guardo en pdf', 'como pdf', 'comparto el reporte', 'compartir el reporte', 'mandar el reporte',
      'enviar el reporte', 'copiar el reporte', 'descargar el reporte', 'guia impresa', 'guia en blanco', 'imprimir la guia',
      'fortalezas', 'areas de mejora', 'observaciones', 'terminar evaluacion', 'terminar la evaluacion', 'reabrir', 'corregir la evaluacion',
      'termine la evaluacion', 'ya termine', 'equivoque en un puntaje', 'me equivoque en', 'cambiar un puntaje', 'corregir un puntaje',
    ],
    answer:
      'En el paso 3 (Reporte) de Entrevistas: "Imprimir o guardar PDF" abre el reporte listo para imprimir (en esa ventana eliges "Guardar como PDF" para mandarlo por correo); también puedes "Copiar texto" o "Descargar .txt". El reporte trae la tabla por competencia, el Índice General, la recomendación con su porqué, fortalezas, áreas de mejora y tus observaciones. "Terminar evaluación" la deja como registro; "Reabrir para corregir" permite cambiarla. Arriba, "Imprimir guía" saca la guía en blanco para tenerla en papel.',
    route: '/competencias',
    routeLabel: 'Ir a Entrevistas',
  },
  {
    id: 'competencias-decidir',
    question: '¿Cómo paso al candidato a Oferta o lo descarto después de la entrevista?',
    keywords: [
      'pasar a oferta', 'paso a oferta', 'pasarlo a oferta', 'pasarla a oferta', 'mover a oferta', 'muevo a oferta', 'mandar a oferta',
      'lo descarto', 'la descarto', 'descartarlo', 'descartarla', 'descartar al candidato', 'descartar a un candidato', 'descartar',
      'mover de etapa', 'muevo de etapa', 'cambiar de etapa', 'cambio de etapa', 'mover al candidato', 'muevo al candidato',
      'regresar a entrevista', 'me equivoque de etapa', 'deshacer', 'candidata a oferta', 'candidato a oferta', 'descarto', 'muevo un candidato', 'mover un candidato',
      'de etapa', 'lo pase a oferta', 'la pase a oferta', 'por error', 'lo regreso', 'la regreso',
    ],
    answer:
      'Al completar el reporte en Entrevistas aparece "Decisión de RR.HH." con dos botones: "Pasar a Oferta" y "Descartar". La recomendación apoya la decisión, pero la decisión es tuya. Al elegir, la evaluación queda terminada y el candidato cambia de etapa en Candidatos. Si te equivocaste, "Regresar a Entrevista" lo devuelve.',
    route: '/competencias',
    routeLabel: 'Ir a Entrevistas',
  },
  {
    id: 'etapas',
    question: '¿Qué significan las etapas de Candidatos?',
    keywords: ['etapa', 'etapas', 'candidatos', 'pipeline', 'tablero', 'aplicado', 'oferta', 'contratado', 'descartado', 'kanban'],
    answer:
      'Aplicados: llegó el CV y nadie lo ha revisado. Screening: ya fue revisado y puntuado. Entrevista: tiene entrevista agendada o hecha (quien confirma en Respuestas a CVs pasa aquí solo). Oferta: se le envió oferta. Contratados y Descartados cierran el proceso. Cada tarjeta muestra el score de la IA y, si ya lo entrevistaste, el resultado de su entrevista por competencias. A Oferta o a Descartados se pasa desde el reporte de la entrevista, en Entrevistas.',
    route: '/candidatos',
    routeLabel: 'Ir a Candidatos',
  },
  {
    id: 'metricas',
    question: '¿Qué mide Métricas RR.HH.?',
    keywords: [
      'metrica', 'métrica', 'metricas', 'métricas', 'tiempo', 'tarda', 'cada quien', 'productividad', 'time to hire',
      'time-to-fill', 'semaforo', 'semáforo',
    ],
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
    keywords: ['equipo', 'agregar persona', 'usuario', 'reclutador', 'asistente de rr.hh', 'asistente de recursos humanos', 'jefe', 'quitar', 'miembro'],
    answer:
      'En Configuración → Equipo de RR.HH. escribe el nombre y el cargo y pulsa Agregar. La persona aparece de inmediato en "Cada quien" de Métricas. Las personas base (Reynaldo y Jessica) no se pueden quitar desde ahí.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  // ---------- Módulo opcional: Entrevistas IA por videollamada ----------
  // Palabras clave: evitar frases genéricas que le roben preguntas a otras funciones (ej. "como activo" se
  // llevaría "¿cómo activo la regla?"). Antes de cambiarlas, correr `npm run check:help`.
  {
    id: 'entrevistas-ia',
    question: '¿Cómo activo las entrevistas por videollamada con IA?',
    keywords: [
      'activar entrevistas', 'activo entrevistas', 'activar las entrevistas', 'activo las entrevistas', 'activar la entrevista',
      'activo la entrevista', 'como activo el modulo', 'como activar el modulo', 'enciendo el modulo', 'encender el modulo',
      'encender entrevistas', 'enciendo entrevistas', 'encender las entrevistas', 'enciendo las entrevistas',
      'habilitar entrevistas', 'aparece entrevistas', 'donde esta entrevistas', 'donde estan las entrevistas', 'entrevistas ia',
      'entrevista ia', 'entrevistas con ia', 'entrevista con ia', 'activar videollamada', 'como prendo', 'donde prendo',
      'prender las', 'prender la', 'prender el', 'no aparece entrevistas', 'no me sale la opcion', 'no me sale entrevistas',
      'no veo entrevistas', 'por que no veo', 'no encuentro entrevistas', 'se activa la videollamada',
      'activo las videollamadas', 'habilito la entrevista', 'habilitar la entrevista', 'se activa el modulo', 'activa el modulo',
      'activo el modulo', 'aparece la seccion', 'seccion de entrevistas',
    ],
    answer:
      'Es un módulo opcional y viene apagado. En Configuración → Módulos opcionales enciende "Entrevistas IA": aparece en el menú de Reclutamiento, después de Entrevistas, y se abre sola la ayuda guiada: una ventana que explica cómo funciona y qué te toca hacer, con un recorrido paso a paso por las pantallas. Esa ayuda también está en el botón Ayuda → Guía.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-como',
    question: '¿Cómo funciona la entrevista por videollamada con IA?',
    keywords: [
      'videollamada', 'video llamada', 'meet', 'videollamada de zoom', 'como funciona', 'como funcionan',
      'como funciona la entrevista', 'como funcionan las entrevistas', 'funciona la entrevista', 'funcionan las entrevistas',
      'funciona la videollamada', 'asistente de ia', 'asistente ia', 'asistente virtual', 'entrevistador', 'entra a la llamada',
      'entra a la videollamada', 'a la llamada', 'entra el asistente', 'transcribe', 'transcripcion', 'es una persona',
      'funciona la video', 'como funciona entrevistas', 'funciona entrevistas', 'como funciona el asistente',
      'funciona el asistente', 'como funciona lo de', 'como es la entrevista', 'como es la video', 'que es entrevistas',
      'para que sirve el modulo', 'para que sirve entrevistas', 'que hace el modulo', 'se conecta', 'habla con el candidato',
      'transcrit', 'eso de la entrevista', 'que es la entrevista', 'teams', 'de que se trata', 'sirve el modulo',
      'hace el modulo', 'que es la entrevista con',
    ],
    answer:
      'Agendas la entrevista como siempre en Respuestas a CVs (Virtual por Zoom), con la casilla "La entrevista la hará el asistente de IA" marcada. A la hora acordada, el asistente de IA entra a la videollamada de Zoom, se presenta como asistente virtual con inteligencia artificial y hace una por una las preguntas del banco de la vacante; todo queda transcrito. Al terminar, en Entrevistas IA ves la evaluación: puntaje global, puntaje por pregunta y diferencias con el CV. La decisión es de RR.HH. La videollamada real está planeada para la Fase 3: en la demo se simula con un chat.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-pasos',
    question: '¿Qué tengo que hacer después de activar Entrevistas IA?',
    keywords: [
      'despues de activar', 'despues de activar entrevistas', 'despues de activar las entrevistas', 'hago despues de activar',
      'al activar', 'ya lo active', 'ya la active', 'que active', 'ya active', 'que tengo que hacer', 'que debo hacer',
      'que me toca', 'que hago ahora', 'y ahora que', 'que sigue', 'primeros pasos', 'despues de activarl', 'ya las activé',
      'acabo de activar', 'ya lo prendi', 'ya lo encendi', 'me toca hacer', 'ahora que hago', 'y ahora q', 'por donde empiezo',
      'pasos para usar', 'que debo preparar', 'antes de usar', 'empezar a usar', 'usar las entrevistas', 'recien active',
      'que hago primero',
    ],
    answer:
      'Cinco cosas: 1) revisa que cada vacante abierta tenga sus preguntas de entrevista (la tarjeta de la vacante dice cuántas tiene); 2) al agendar en Respuestas a CVs deja marcada la casilla "La entrevista la hará el asistente de IA", que agrega al mensaje el aviso de IA y grabación; 3) haz una entrevista de prueba en Entrevistas IA; 4) lee cada evaluación antes de decidir y confirma con el candidato cualquier diferencia con su CV; 5) si decides no usarlo, apaga el módulo en Configuración.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-preguntas',
    question: '¿Qué preguntas hace el asistente de IA en la entrevista?',
    keywords: [
      'que preguntas hace', 'preguntas hace el asistente', 'que pregunta el asistente', 'banco de preguntas',
      'preguntas de entrevista', 'preguntas de la entrevista', 'preguntas de la vacante', 'preguntas de una vacante',
      'preguntas ia', 'improvisa', 'cambio las preguntas', 'cambiar las preguntas', 'editar preguntas', 'edito las preguntas',
      'editar las preguntas', 'no tiene preguntas', 'sin preguntas', 'qué pregunta', 'le pregunta', 'preguntas hace',
      'preguntas que hace', 'pregunta lo mismo', 'cuantas preguntas', 'preguntas para la entrevista', 'tiene preguntas',
      'saca las preguntas', 'pongo las preguntas', 'inventa', 'mismas preguntas', 'hace las mismas',
    ],
    answer:
      'Solo las del banco de la vacante, en orden; no improvisa. Se definen al crear la vacante, en el paso 4 del formulario de "Nueva vacante" ("Preguntas IA"), generadas con IA o escritas a mano, y hoy no se pueden editar después: si necesitas otras, crea la vacante de nuevo. La tarjeta de cada vacante dice cuántas tiene. Si una vacante no tiene preguntas, el asistente de IA usa 3 generales: por qué le interesa el puesto, un logro del que se sienta orgulloso y su disponibilidad para empezar.',
    route: '/vacantes',
    routeLabel: 'Ir a Vacantes',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-aviso',
    question: '¿El candidato sabe que lo entrevista una IA? ¿Se graba?',
    keywords: [
      'sabe que', 'se presenta', 'avisar', 'aviso', 'consentimiento', 'graba', 'se graba', 'graba la entrevista', 'grabar',
      'grabación', 'privacidad', 'robot', 'persona real', 'con una persona', 'se da cuenta', 'decirle', 'le digo', 'es una ia',
      'es un robot', 'hablar con una', 'permiso', 'grabado', 'queda grabad', 'aviso al candidato', 'como aviso',
    ],
    answer:
      'Sí, si mandas el mensaje con la casilla "La entrevista la hará el asistente de IA" marcada (viene marcada cuando el módulo está activo): el mensaje dice "La entrevista la hará nuestro asistente virtual con inteligencia artificial y se grabará para evaluarla". Y al empezar, el asistente se presenta como asistente virtual con IA y recuerda que la entrevista se graba. Si el candidato prefiere hablar con una persona, envíale el mensaje con la casilla desmarcada y la entrevista la hace alguien del equipo.',
    route: '/respuestas',
    routeLabel: 'Ir a Respuestas a CVs',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-demo',
    question: '¿Cómo pruebo la entrevista IA en la demo?',
    keywords: [
      'como pruebo', 'pruebo', 'probar', 'probar la entrevista', 'pruebo la entrevista', 'probarla', 'probarlo',
      'entrevista de prueba', 'simular', 'simulada', 'iniciar entrevista', 'chat de entrevista', 'reiniciar', 'reinicio',
      'reinicia', 'empezar de nuevo', 'prueba de la entrevista', 'prueba de entrevista', 'de practica', 'practicar',
      'inicio una entrevista', 'pruebo la video', 'probar la video', 'la pruebo', 'simular una', 'simular la videollamada',
    ],
    answer:
      'Abre Entrevistas IA, elige un candidato y pulsa "Iniciar entrevista". En la demo la videollamada se simula con un chat: el asistente de IA saluda y hace las preguntas de la vacante, y tú escribes las respuestas como lo haría el candidato. Al terminar aparece la evaluación a la derecha. En la demo el puntaje es aproximado (premia respuestas completas que mencionan los requisitos) y la conversación no se guarda al salir. "Reiniciar" empieza de nuevo. En la lista aparecen los candidatos ya puntuados, incluidos los que confirmaron su entrevista en Respuestas a CVs.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-evaluacion',
    question: '¿Cómo leo la evaluación de la entrevista IA?',
    keywords: [
      'evaluación', 'la evaluación', 'evaluación de la entrevista', 'evalúa', 'puntaje global', 'puntaje de la entrevista',
      'discrepancia', 'diferencias con el cv', 'resultado de la entrevista', 'calificación', 'califica', 'interpreto',
      'nota necesita', 'para pasar a oferta', 'amarillo', 'sale amarillo', 'resultados de la', 'leo los resultados', 'si miente',
      'miente sobre',
    ],
    answer:
      'Al terminar la entrevista aparecen tres cosas: el puntaje global de 0 a 100 (verde desde 80: recomendado para avanzar a oferta; ámbar desde 60: evaluar con el equipo; rojo abajo: revisar con cuidado), el puntaje de 1 a 10 de cada pregunta y las discrepancias entre el CV y lo que dijo el candidato (por ejemplo, años de experiencia distintos). Es una recomendación: la decisión la toma RR.HH.',
    route: '/entrevistas',
    routeLabel: 'Ir a Entrevistas IA',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-decide',
    question: '¿La IA decide si el candidato avanza o se descarta?',
    keywords: [
      'la ia decide', 'decide la ia', 'quien decide si', 'decision de la ia', 'contrata sola', 'descarta sola', 'la ia contrata',
      'la ia descarta', 'reemplaza a rr.hh', 'rechaza sola', 'la ia rechaza', 'rechaza', 'descarta a', 'reemplazar al',
      'lo contrato', 'toma la decision',
    ],
    answer:
      'No. El asistente de IA entrevista y recomienda; la decisión siempre es de RR.HH. Lee la transcripción y la evaluación, confirma con el candidato cualquier diferencia con su CV y decide si pasa a Oferta o se descarta. La decisión se registra en Entrevistas: al completar el reporte de la entrevista por competencias aparecen los botones Pasar a Oferta y Descartar.',
    route: '/candidatos',
    routeLabel: 'Ir a Candidatos',
    topic: 'interviewsAi',
  },
  {
    id: 'entrevista-ia-apagar',
    question: '¿Cómo desactivo Entrevistas IA?',
    keywords: [
      'desactivar', 'desactivo', 'desactivar entrevistas', 'desactivo entrevistas', 'desactivar las entrevistas',
      'desactivo las entrevistas', 'apagar entrevistas', 'apago entrevistas', 'apagar las entrevistas', 'apago las entrevistas',
      'apagar el modulo', 'desactivar el modulo', 'apagar', 'apago', 'apaga', 'del menu', 'quito entrevistas',
      'quitar entrevistas', 'ocultar entrevistas', 'desactiv', 'deshabilit', 'la quitamos', 'ya no queremos', 'como apago',
      'como apagar', 'apago las', 'apagar las', 'como oculto', 'oculto entrevistas', 'deshabilitar las entrevistas',
      'deshabilito', 'apagar la entrevista', 'apago la entrevista',
    ],
    answer:
      'En Configuración → Módulos opcionales apaga el interruptor de Entrevistas IA. La sección se oculta del menú y no se pierde nada; puedes volver a encender el módulo cuando quieras y se abrirá otra vez la ayuda guiada.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'interviewsAi',
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
    keywords: ['demo', 'datos', 'real', 'reales', 'prueba', 'simulado', 'mock', 'guardar', 'guarda', 'persistencia'],
    answer:
      'Ahora la app corre en modo demostración: los datos son de ejemplo y la IA está simulada. Lo que haces (vacantes creadas, CVs cargados, mensajes enviados, metas, equipo, módulos) se guarda en este navegador. La conexión a datos reales y a la IA de verdad se activa después de la aprobación.',
  },
  {
    id: 'comentarios',
    question: '¿Cómo envío mis comentarios o dudas a Oscar?',
    keywords: [
      'comentario', 'comentarios', 'sugerencia', 'enviar', 'oscar', 'retroalimentacion', 'retroalimentación', 'feedback',
      'ronda', 'prueba', 'guion', 'guión',
    ],
    answer:
      'Todo lo que preguntas aquí queda guardado. Ve a Configuración → "Preguntas al chat de ayuda" y pulsa "Enviar a Oscar": se abre un correo con tus preguntas y espacio para tus respuestas. El guion de la ronda de prueba (qué probar cada día) está en la pestaña Guía del botón de ayuda.',
    route: '/ronda-de-prueba',
    routeLabel: 'Ver la ronda de prueba',
  },
  {
    id: 'tour',
    question: '¿Cómo vuelvo a ver el tour o el video?',
    keywords: [
      'tour', 'video', 'el video', 'los videos', 'guia', 'guía', 'tutorial', 'ayuda', 'aprender', 'capacitacion', 'capacitación',
      'un video', 'ver video', 'video de entrevistas', 'video de las entrevistas', 'ayuda guiada', 'el tutorial',
      'ver la ayuda guiada', 'volver a ver',
    ],
    answer:
      'Desde el botón de ayuda (abajo a la derecha): la pestaña "Guía" inicia el tour paso a paso por las pantallas (y la ayuda guiada de Entrevistas IA) y la pestaña "Video" tiene el recorrido narrado de 3 minutos y medio y el video de Entrevistas IA por videollamada, con capítulos.',
  },
];
