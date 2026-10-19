// ============================================================
//  Base de conocimiento de la ayuda (preguntas frecuentes).
//  Demo: el chat de ayuda responde con esto (búsqueda por palabras clave).
//  Producción: se entrega como contexto al LLM (Claude) para respuestas libres.
// ============================================================
import type { GuideId } from '../core/modules';

export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  /** Ruta a la que conviene ir para hacerlo. */
  route?: string;
  routeLabel?: string;
  /** Módulo opcional o sección (Talento, Gestión) a la que pertenece: tiene prioridad cuando el chat se abre desde su ayuda. */
  topic?: GuideId;
}

export const HELP_FAQ: FaqEntry[] = [
  {
    id: 'flujo',
    question: '¿Cómo funciona TALENTIA en general?',
    keywords: ['flujo', 'proceso', 'general', 'empezar', 'inicio', 'como funciona', 'que hace talentia', 'que hace la app', 'pasos'],
    answer:
      'El proceso siempre es el mismo, en este orden: 1) creas la vacante en Vacantes, 2) subes los CVs en Screening IA y la IA los puntúa, 3) en Respuestas a CVs filtras los mejores y les mandas el mensaje para agendar la entrevista, 4) en Entrevistas haces la entrevista con la guía de competencias y la app calcula el reporte, 5) en Candidatos sigues a cada persona por etapa, y 6) en Métricas RR.HH. ves cuánto tarda cada quien. Quien es contratado pasa a Talento (Matriz 9-Box y Acciones RR.HH.), y en Configuración se ajustan equipo, metas y módulos. Puedes ver el tour guiado desde el botón de ayuda; Talento y Gestión tienen su propio recorrido en Ayuda → Guía.',
    route: '/',
    routeLabel: 'Ir al Dashboard',
  },
  {
    id: 'vacante',
    question: '¿Cómo creo una vacante?',
    keywords: ['vacante', 'plaza', 'puesto', 'crear vacante', 'nueva vacante', 'publicar', 'linkedin', 'marca'],
    answer:
      'Ve a Vacantes y pulsa "Nueva vacante". El formulario tiene 5 pasos: básicos (título, marca Americana/Abiq/Friotec, plazas, salario), descripción generada con IA, filtros de screening (los criterios con los que la IA puntuará los CVs), preguntas extra opcionales para el entrevistador y revisión; la entrevista usa la guía de competencias que corresponde al título (Vendedor o Jefe de Tienda) y la tarjeta de la vacante la muestra. Al final puedes descargar el XML para publicar en LinkedIn.',
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
      'En Entrevistas elige al candidato (aparecen los que están en la etapa Entrevista) y pulsa "Empezar la entrevista". La guía depende del puesto: Vendedor (10 preguntas conductuales, 45 min) o Jefe de Tienda (12, 60 min). Son 3 pasos: 1) Entrevista: haces las preguntas en orden —conductuales, la historia y al final las de opción múltiple— y anotas frases textuales del candidato; debajo de cada pregunta dice qué evidencia buscar y arriba tienes las repreguntas neutrales. 2) Puntuar: al terminar das de 1 a 5 a cada respuesta. 3) Reporte: la app calcula cada competencia, el Índice General y la recomendación. Todo se guarda solo. "Imprimir guía" saca la guía en blanco en papel. Si el módulo Entrevistas IA está activo, el asistente puede hacer la entrevista con esta misma guía y dejarte la transcripción como borrador para puntuar.',
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
      'reporte de la entrevista', 'reporte de competencias', 'reporte del candidato', 'el reporte', 'gerente de tienda', 'al gerente de tienda',
      'le mando el reporte', 'imprimir', 'imprimo', 'impreso',
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
      'metrica', 'tiempo', 'tarda', 'cada quien', 'productividad', 'time to hire',
      'time-to-hire', 'que mide', 'cuatro numeros', 'cuanto se tarda', 'cuanto tarda', 'tiempos del equipo', 'medir',
      'mide el trabajo', 'rendimiento', 'desempeño del equipo', 'para que sirve metricas', 'que es metricas', 'gestion',
      'como funciona gestion', 'que es gestion', 'seccion de gestion', 'seccion gestion', 'explicacion de gestion', 'esta seccion',
    ],
    answer:
      'Cuánto tarda cada persona del equipo de RR.HH. en hacer lo suyo: revisar un CV (desde que llega), responder al candidato, llegar a la entrevista, decidir y cerrar la oferta, comparado con la meta de cada etapa (verde dentro de la meta, ámbar hasta 1.5 veces, rojo después). Arriba están los cuatro números del equipo; luego la tabla "Cada quien" por persona, el tiempo por etapa con el cuello de botella, el embudo, la tabla por vacante y la lista de pendientes fuera de meta con su responsable. Es para el propio departamento, no para la gerencia.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-cada-quien',
    question: '¿Qué significa cada columna de "Cada quien"?',
    keywords: [
      'columna', 'columnas', 'cada columna', 'columna de', 'columnas de', 'significa cada columna', 'cada quien', 'asignados', 'activos', 'a tiempo', 'porcentaje a tiempo', '% a tiempo', 'tabla por persona',
      'tiempos por persona', 'carga por persona', 'carga de trabajo', 'grafica', 'gráfica', 'dias promedio', 'promedio por persona',
      'que significa asignados', 'que son activos', 'por reclutador', 'cada reclutador', 'cuanto tarda cada', 'tarda cada quien',
      'tarda jessica', 'tarda reynaldo', 'jessica', 'reynaldo', 'fila de cada', 'cuantos candidatos tiene',
    ],
    answer:
      'Una fila por persona del equipo. Asignados: candidatos que le tocan; Activos: los que siguen en proceso. Revisar CV, Responder y Entrevistar: días promedio desde que llega el CV, desde que se revisó y desde que se respondió, con el color de su meta y el % que hizo a tiempo. Entrev., Ofertas y Contrat.: cuántas lleva. Time-to-hire: días desde que el candidato aplicó hasta que se contrató. Pendientes: cuántos CVs le faltan por revisar o responder. La gráfica compara los días promedio de cada persona.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-semaforo',
    question: '¿Qué significan los colores verde, ámbar y rojo en Métricas?',
    keywords: [
      'verde', 'ambar', 'ámbar', 'amarillo en metricas', 'rojo', 'color', 'colores', 'semaforo', 'semáforo', '1.5', 'una y media',
      'por que sale rojo', 'por que esta en rojo', 'sale en rojo', 'en rojo', 'en verde', 'que significa el color',
      'significan los colores', 'significa rojo', 'significa verde', 'significa ambar',
    ],
    answer:
      'Es el semáforo de la meta de cada etapa: verde cuando el promedio está dentro de la meta en días, ámbar cuando se pasa hasta 1.5 veces la meta (por ejemplo, meta 2 días y promedio 3) y rojo cuando se pasa más. Las metas se definen en Configuración → Metas de servicio; al cambiarlas, los colores se recalculan al instante.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-etapas',
    question: '¿Qué son el tiempo por etapa, el cuello de botella y el embudo?',
    keywords: [
      'tiempo por etapa', 'por etapa', 'cuello de botella', 'embudo', 'conversion', 'conversión', 'recibidos', 'revisados',
      'respondidos', 'entrevistados', 'con oferta', 'marca vertical', 'la marca', 'linea de la meta', 'etapa mas lenta',
      'donde se atora', 'se atora', 'atorado', 'se atasca', 'cuantos llegan', 'cuantos pasan', 'cuantos candidatos', 'pasan a', 'llegan a entrevista',
      'pasan a entrevista', 'funnel', 'barra de cada etapa',
    ],
    answer:
      'Tiempo por etapa muestra el promedio en días de las 5 etapas (revisar, responder, entrevistar, decidir y cerrar) contra su meta, que es la marca vertical de cada barra, con el % de casos a tiempo; la etapa que más se pasa de su meta se señala como cuello de botella. El embudo dice, de los CVs recibidos, cuántos se revisaron, respondieron, entrevistaron, recibieron oferta y se contrataron, con su porcentaje.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-vacante',
    question: '¿Qué muestra la tabla por vacante en Métricas?',
    keywords: [
      'por vacante', 'tabla por vacante', 'dias abierta', 'días abierta', 'plazas cubiertas', 'cobertura', 'cubiertas', 'time-to-fill',
      'time to fill', 'cuanto lleva abierta', 'vacante abierta', 'cuanto tarda en llenar', 'llenar la vacante', 'cubrir la vacante',
      'cubrir la plaza', 'plazas', 'metricas de la vacante', 'metricas por vacante',
    ],
    answer:
      'Cada vacante con sus días abierta, candidatos recibidos y cuántos siguen activos, cuánto se tarda en revisar sus CVs (con el color de la meta), plazas cubiertas (contratados sobre plazas, con el porcentaje) y time-to-fill: días desde que se abrió la vacante hasta la contratación. El filtro "Vacante" de arriba deja solo una.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-pendientes',
    question: '¿Qué son los pendientes fuera de meta?',
    keywords: [
      'pendiente', 'pendientes', 'fuera de meta', 'pendientes por persona', 'esperando', 'lista de trabajo', 'que me falta',
      'que falta hacer', 'urgente', 'urgentes', 'atrasado', 'atrasados', 'retrasado', 'retrasados', 'que tengo pendiente',
      'que le falta', 'quien tiene pendientes', 'cuantos pendientes', 'en tiempo',
    ],
    answer:
      'Es la lista de trabajo del día: cada cosa que falta hacer (revisar un CV, responder al candidato, decidir tras la entrevista, cerrar la oferta o pedir un CV legible), con el candidato, el responsable y cuántos días lleva esperando contra la meta de esa etapa. "Fuera de meta" ya se pasó de los días permitidos: es lo primero que hay que atender. El Dashboard muestra el total.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-filtros',
    question: '¿Cómo filtro Métricas por vacante o por persona?',
    keywords: [
      'filtrar metricas', 'filtro de metricas', 'filtros de metricas', 'filtro las metricas', 'filtro metricas', 'filtrar las metricas',
      'filtro en metricas', 'filtro metricas por', 'o por persona', 'por vacante o', 'solo lo mio', 'solo mis candidatos', 'ver solo lo', 'todo el equipo', 'todas las vacantes',
      'filtrar por persona', 'filtrar por vacante', 'filtro de persona', 'filtro de vacante', 'solo una vacante', 'solo una persona',
      'metricas de una persona', 'metricas de una vacante', 'mis metricas', 'mis numeros', 'por persona', 'de una sola', 'una sola vacante',
      'una sola persona', 'de una vacante', 'de una persona', 'solo mis', 'solo los mios', 'solo las mias',
    ],
    answer:
      'Arriba de Métricas hay dos filtros: Vacante (todas o una) y Persona (todo el equipo o alguien). Toda la pantalla responde a ellos: los cuatro números, "Cada quien", el tiempo por etapa, el embudo, la tabla por vacante y los pendientes. Así cada quien puede ver solo lo suyo o una plaza en particular.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metricas-corte',
    question: '¿Por qué Métricas dice "corte al 20 de junio" y mis CVs no aparecen?',
    keywords: [
      'corte', 'corte al', 'dice corte', 'fecha de corte', '20 de junio', 'no cambia', 'no aparecen', 'mis cvs no', 'cvs no aparecen', 'no aparece en metricas', 'no se actualiza', 'no actualiza', 'no aparecen en metricas',
      'no salen en metricas', 'no se ven en metricas', 'desactualizado', 'desactualizada', 'cvs que cargue no', 'no cuenta mis',
      'no suma', 'no suman', 'no se mueven los numeros', 'mismos numeros', 'por que no cambia',
    ],
    answer:
      'En la demo, Métricas se calcula sobre el set de ejemplo (23 candidatos de dos vacantes de Americana) con corte al 20 de junio de 2026: las fechas no avanzan con el reloj real y los CVs que cargues o los mensajes que envíes todavía no entran, porque esas fechas se guardarán con la base de datos de la Fase 2. Lo que sí cambia al instante son las metas que edites en Configuración.',
    route: '/metricas',
    routeLabel: 'Ir a Métricas RR.HH.',
    topic: 'management',
  },
  {
    id: 'metas',
    question: '¿Cómo cambio las metas de servicio?',
    keywords: [
      'meta', 'metas', 'sla', 'dias', 'días', 'objetivo', 'cambiar meta', 'editar meta', 'restablecer metas', 'metas de fabrica',
      'de fabrica', 'metas de servicio', 'meta en dias', 'cuantos dias', 'personalizadas', 'metas realistas', 'quien decide las metas',
      'dias para responder', 'dias para revisar', 'dias para entrevistar', 'dias para decidir', 'dias para cerrar',
    ],
    answer:
      'En Configuración → Metas de servicio. Son cinco números en días (revisar, responder, entrevistar, decidir, cerrar). Se aplican al instante en Métricas y en el Dashboard, y "Restablecer" vuelve a los valores de fábrica (2, 1, 5, 3 y 5 días).',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
  },
  {
    id: 'equipo',
    question: '¿Cómo agrego a alguien del equipo de RR.HH.?',
    keywords: [
      'equipo', 'agregar persona', 'usuario', 'usuarios', 'reclutador', 'reclutadora', 'asistente de rr.hh', 'asistente de recursos humanos',
      'jefe', 'quitar', 'quito', 'quito a', 'quitar a', 'del equipo de', 'persona del equipo', 'miembro', 'agregar a alguien', 'nueva persona', 'otra persona', 'quien esta en el equipo', 'equipo de rr.hh',
      'contraseña', 'contraseñas', 'iniciar sesion', 'login', 'base', 'cargo',
    ],
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
      'Agendas la entrevista como siempre en Respuestas a CVs (Virtual por Zoom), con la casilla "La entrevista la hará el asistente de IA" marcada. A la hora acordada, el asistente de IA entra a la videollamada de Zoom, se presenta como asistente virtual con inteligencia artificial y hace una por una las preguntas de la guía de competencias de RR.HH. (Vendedor o Jefe de Tienda, según la vacante), con repreguntas si la respuesta es vaga; todo queda transcrito. Al terminar, la transcripción queda como borrador en Entrevistas con una sugerencia preliminar de puntaje y las diferencias con el CV; tú puntúas de 1 a 5 y la app calcula el reporte. La decisión es de RR.HH. La videollamada real está planeada para la Fase 3: en la demo se simula con un chat.',
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
      'Cinco cosas: 1) revisa que cada vacante tenga la guía correcta, Vendedor o Jefe de Tienda (se deduce del título y la tarjeta de la vacante la muestra); 2) al agendar en Respuestas a CVs deja marcada la casilla "La entrevista la hará el asistente de IA", que agrega al mensaje el aviso de IA y grabación; 3) haz una entrevista de prueba en Entrevistas IA; 4) al terminar, abre "Puntuar en Entrevistas", lee la transcripción, puntúa de 1 a 5 y confirma con el candidato cualquier diferencia con su CV; 5) si decides no usarlo, apaga el módulo en Configuración.',
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
      'saca las preguntas', 'pongo las preguntas', 'inventa', 'mismas preguntas', 'hace las mismas', 'preguntas de la guia',
      'usa la guia', 'con la guia', 'preguntas extra', 'preguntas adicionales', 'la ia usa la guia', 'guia de competencias la ia',
    ],
    answer:
      'Las de la guía de entrevista por competencias de RR.HH., las mismas que haría una persona: para Vendedor, 10 preguntas conductuales, la historia y 5 de opción múltiple (45 min); para Jefe de Tienda, 12, la historia y 6 (60 min). Van en el orden de la guía, con repreguntas neutrales si la respuesta es vaga ("¿Qué hiciste tú específicamente? ¿Cuál fue el resultado?"), y el asistente no improvisa. La guía se deduce del título de la vacante y se ve en su tarjeta. Las "preguntas extra" del formulario de la vacante son opcionales y quedan para el entrevistador; la IA no las usa.',
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
      'Abre Entrevistas IA, elige un candidato y pulsa "Iniciar entrevista". En la demo la videollamada se simula con un chat: el asistente de IA saluda y hace las preguntas de la guía de competencias (16 para Vendedor, 19 para Jefe de Tienda; en opción múltiple contestas con la letra), y tú escribes las respuestas como lo haría el candidato; si una respuesta es muy corta, repregunta. Al terminar, la transcripción queda como borrador en Entrevistas y a la derecha ves la sugerencia preliminar y las discrepancias. El chat no se guarda al salir; "Reiniciar" empieza de nuevo. En la lista aparecen los candidatos ya puntuados, incluidos los que confirmaron su entrevista en Respuestas a CVs.',
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
      'sugerencia', 'sugerencia preliminar', 'borrador', 'puntuar en entrevistas', 'como puntuo', 'puntuo lo que', 'puntuar lo que', 'entrevisto la ia', 'lo que entrevisto', 'la ia entrevisto', 'transcripcion queda', 'donde queda la transcripcion', 'queda la entrevista',
    ],
    answer:
      'Al terminar, la transcripción queda guardada como borrador en Entrevistas: cada respuesta bajo su pregunta y las opciones múltiples ya marcadas. En Entrevistas IA ves la sugerencia preliminar de la IA de 1 a 5 por pregunta con la escala de la guía (sube con un ejemplo concreto, acciones propias y un resultado medible; baja si solo habla en plural, con tope de 3), los puntos de cada opción múltiple (5, 3 o 1) y las discrepancias entre el CV y lo que dijo (por ejemplo, años de experiencia distintos). El puntaje válido lo das tú en Entrevistas ("Puntuar en Entrevistas"); la app calcula el Índice General y la recomendación.',
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
      'No. El asistente de IA entrevista y sugiere; la decisión siempre es de RR.HH. En Entrevistas lees la transcripción, puntúas tú de 1 a 5 cada respuesta (la sugerencia de la IA es orientativa), confirmas con el candidato cualquier diferencia con su CV y, al completar el reporte, decides con los botones Pasar a Oferta y Descartar.',
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
    question: '¿Para qué sirve la sección Talento (Matriz 9-Box)?',
    keywords: [
      '9-box', '9 box', 'nine', 'nine box', 'talento', 'matriz', 'colaborador', 'colaboradores', 'contratados', 'la gente contratada',
      'gente contratada', 'seccion talento', 'que es talento', 'para que sirve talento', 'modulo de talento', 'personal',
      'empleados', 'empleado', 'despues de contratar', 'ya contratado', 'ya contratada', 'desempeño', 'cultura', 'como funciona talento',
      'funciona talento', 'como funciona la matriz', 'funciona la matriz', 'explicacion de talento', 'esta seccion', 'que me toca hacer en talento',
    ],
    answer:
      'Talento es para la gente ya contratada: cuando Reclutamiento termina, la persona pasa aquí. La Matriz 9-Box cruza su desempeño (ventas, KPIs) con su cultura y potencial (evaluación 360°), ambos de 1 a 5, en 9 cuadrantes; filtra por departamento y toca a cualquiera para ver su perfil (historial por trimestre, 10 dimensiones 360° y recomendación de crecimiento). Acciones RR.HH. sugiere qué hacer con cada quien y arma el reporte para cada gerente. Los datos entran por las plantillas estándar de Colaboradores, KPIs de Desempeño y Cultura 360°.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
  },
  {
    id: 'talento-cuadrantes',
    question: '¿Qué significa cada cuadrante de la 9-Box?',
    keywords: [
      'cuadrante', 'cuadrantes', 'superestrella', 'super estrella', 'estrella', 'futuro lider', 'futuro líder', 'diamante en bruto',
      'diamante', 'colaborador clave', 'profesional', 'critico', 'crítico', 'critico o inadecuado', 'inadecuado', 'inconsistente',
      'colaborador inconsistente', 'buen colaborador', 'calcula el cuadrante', 'se calcula el cuadrante', 'de la matriz', 'los colores de la matriz',
      'colores de las celdas', 'color de la celda', 'colores de los cuadrantes', 'significa cada cuadrante', 'cada cuadrante',
      'ejes', 'eje', 'que significa superestrella', 'arriba a la derecha', 'abajo a la izquierda', 'punto', 'puntos', 'los puntos',
      'colores de la matriz', 'celda', 'celdas', 'casilla', 'donde cae', 'en que cuadrante', 'por que esta en', 'como se calcula el cuadrante',
      'cambiar de cuadrante', 'cambiar el cuadrante', 'mover a una persona', 'lo mejor', 'los mejores', 'en riesgo',
    ],
    answer:
      'El eje horizontal es Desempeño y el vertical Cultura / Potencial, de 1 a 5, cada uno en tres franjas (bajo hasta 2.3, medio hasta 3.7, alto). Arriba a la derecha está lo mejor: Superestrella (alto en ambos), Estrella (alto desempeño, cultura media) y Futuro Líder (alta cultura, desempeño medio). En el centro, Colaborador Clave; Profesional rinde pero su cultura es baja; Diamante en Bruto tiene gran cultura pero rinde poco. Abajo a la izquierda está el riesgo: Crítico o Inadecuado (bajo en ambos), Buen Colaborador y Colaborador Inconsistente. El cuadrante se calcula solo con los puntajes: no se cambia a mano, cambia cuando cambia la evaluación.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
  },
  {
    id: 'talento-perfil',
    question: '¿Qué muestra el perfil de una persona en Talento?',
    keywords: [
      'perfil', 'el perfil', 'perfil de una', 'perfil de una persona', 'muestra el perfil', 'perfil de la persona', 'abrir perfil', 'abrir el perfil', 'ver perfil', 'ver el perfil', 'abro el perfil', 'enps', 'historial', 'trimestre', 'trimestres',
      'semaforo por trimestre', 'evaluacion de la persona', 'datos de la persona', 'ficha', 'ficha de', 'barras de colores',
      'barras del historial', 'ultimos trimestres', 'como va', 'como le ha ido', 'tendencia', 'mejoro', 'empeoro', 'historia de',
      'que es el enps', 'que significa enps', 'toco a una persona', 'clic en una persona', 'clic en el nombre', 'ver a una persona',
    ],
    answer:
      'Toca a la persona en la matriz o en la lista. El perfil muestra su cargo, departamento y jefe; Desempeño y Cultura de 1 a 5, eNPS (qué tanto recomendaría la empresa, de 0 a 100) y su cuadrante; el historial de los últimos 6 trimestres como barras con semáforo (promedio de desempeño y cultura: verde desde 3.6, amarillo en medio, rojo abajo de 2.5); la decisión sugerida de RR.HH. con su base; sus 10 dimensiones de Cultura 360°; y la recomendación de crecimiento con los 7 Hábitos, que se envía por WhatsApp a la persona y a su jefe.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
  },
  {
    id: 'talento-cultura',
    question: '¿Qué es la Cultura 360° y sus 10 dimensiones?',
    keywords: [
      'cultura 360', '360', 'dimensiones', 'dimension', 'dimensión', 'liderazgo', 'comunicacion y soporte', 'inteligencia emocional',
      'claridad', 'alineacion', 'inspiracion', 'empoderamiento', 'integridad', 'coherencia', 'feedback', 'transparencia', 'mentoring',
      'coaching', 'resolucion de conflictos', 'conflictos', 'cultura del equipo', 'potencial', 'que es cultura', 'que mide cultura',
      'quien evalua la cultura', 'quien califica', 'quien llena la evaluacion', 'trabajo en equipo', 'soporte', 'que es claridad',
      'que es la claridad', 'que es inspiracion', 'que es empoderamiento', 'que significa empoderamiento', 'que es integridad',
      'que es feedback', 'que es transparencia', 'que es mentoring', 'que es coaching', 'que es soporte', 'que es resolucion',
      'que mide inteligencia', 'la dimension', 'dimension de', 'dimensiones de', 'las 10', 'las diez', 'diez dimensiones', '10 dimensiones',
      'en la cultura', 'de la cultura', 'evaluacion de cultura',
    ],
    answer:
      'Es la evaluación 360° (jefe, pares y equipo) de 10 dimensiones de 1 a 5, en 3 grupos: Liderazgo (claridad y alineación, inspiración al logro, empoderamiento, integridad y coherencia), Comunicación y Soporte (calidad del feedback, soporte y trabajo en equipo, transparencia, mentoring/coaching) e Inteligencia Emocional (inteligencia emocional, resolución de conflictos). Su promedio es el puntaje de Cultura de la 9-Box. En la Matriz 9-Box se ve el promedio del equipo (o del departamento filtrado); en el perfil, el de cada persona. Verde desde 4.0, ámbar desde 3.0, rojo abajo. Los datos entran por la plantilla de Cultura 360°.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
  },
  {
    id: 'talento-decision',
    question: '¿Cómo se decide la acción sugerida (aumento, advertencia, capacitación)?',
    keywords: [
      'decision sugerida', 'accion sugerida', 'aumento', 'ascenso', 'bono', 'premio', 'reconocimiento', 'advertencia', 'carta de advertencia',
      'suspension', 'suspensión', 'desvinculacion', 'desvinculación', 'despedir', 'despido', 'capacitacion obligatoria', 'plan de mejora',
      'racha', 'trimestres seguidos', 'consecutivos', 'reglas', 'regla de las acciones', 'como se decide', 'quien decide el aumento',
      'cuando se da un aumento', 'cuando se da el bono', 'por que le sugiere', 'por que sugiere', 'de donde sale la accion', 'de donde sale la decision',
      'es la ia la que decide', 'decide la app', 'la app decide', 'base:', 'que significa base', 'seguimiento cercano', 'dia de permiso',
      'en observacion', 'en riesgo', 'positivo', 'cuantos trimestres', 'criterio', 'criterios de la accion', 'politica', 'política',
      'cuando toca', 'le toca capacitacion', 'toca capacitacion', 'mandar a capacitacion', 'cuando se despide', 'cuando se suspende',
      'seguidos en verde', 'seguidos en rojo', 'seguidos en amarillo',
    ],
    answer:
      'Son reglas fijas y auditables, sin IA. Cada trimestre tiene un semáforo (promedio de desempeño y cultura: verde desde 3.6, rojo abajo de 2.5, amarillo en medio) y la acción depende de cuántos trimestres seguidos lleva la persona en ese color. Verde: 1 trimestre = reconocimiento formal; 2 = bono + día de permiso; 3 = premio y candidato a ascenso; 4 o más = aumento de sueldo o ascenso. Amarillo: 1 = plan de seguimiento; 2 = seguimiento cercano con meta; 3 o más = capacitación obligatoria + plan de mejora. Rojo: 1 = carta de advertencia; 2 = suspensión + plan de mejora final; 3 o más = recomendación de desvinculación. La línea "Base" de cada tarjeta dice qué racha la disparó. La app sugiere; la decisión es de RR.HH.',
    route: '/acciones',
    routeLabel: 'Ir a Acciones RR.HH.',
    topic: 'talent',
  },
  {
    id: 'talento-crecimiento',
    question: '¿Qué es la recomendación de crecimiento (7 Hábitos) y cómo la envío?',
    keywords: [
      '7 habitos', '7 hábitos', 'siete habitos', 'habitos', 'hábitos', 'habito', 'hábito', 'covey', 'recomendacion de crecimiento',
      'plan de crecimiento', 'crecimiento', 'generar recomendacion', 'generar la recomendacion', 'cursos', 'cursos recomendados',
      'acciones esta semana', 'enviar por whatsapp', 'whatsapp a la persona', 'al jefe', 'mandar al jefe', 'mensaje al colaborador',
      'mensaje a la persona', 'proactivo', 'ganar-ganar', 'desarrollo', 'plan de desarrollo', 'capacitar a', 'que curso',
      'mandarle el plan', 'enviarle el plan', 'le llega a la persona', 'le llega al jefe',
    ],
    answer:
      'En el perfil de la persona, "Generar recomendación (IA)" elige el hábito de Covey en que conviene enfocarse (por ejemplo "Ser proactivo" si desempeño y cultura están bajos, o "Buscar primero entender" si rinde pero su cultura es baja), explica por qué a partir de su dimensión 360° más débil, y propone 3 acciones para esta semana y cursos. Con los dos botones de WhatsApp envías un mensaje listo a la persona (su enfoque y primer paso) y otro a su jefe (resultado, enfoque y acciones). En la demo la recomendación es simulada con reglas; en producción la hará la IA real.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
  },
  {
    id: 'acciones',
    question: '¿Cómo uso Acciones RR.HH.?',
    keywords: [
      'acciones rr.hh', 'acciones rrhh', 'acciones pendientes', 'acciones', 'accion', 'tablero de acciones', 'marcar hecha', 'marcar como hecha',
      'marco hecha', 'hecha', 'completadas', 'completada', 'atencion / riesgo', 'atencion riesgo', 'atencion o riesgo', 'reconocer / premiar',
      'reconocer', 'premiar', 'seguimiento', 'que hago con cada quien', 'prioridad', 'prioridades', 'lista de acciones', 'que tengo que hacer con',
      'que debo hacer con', 'con cada colaborador', 'con cada persona', 'pendientes de talento', 'acciones de talento', 'tablero de talento',
      'se guarda lo marcado', 'marque hecha', 'ya la hice', 'ya lo hice', 'desmarcar', 'reabrir una accion',
    ],
    answer:
      'Acciones RR.HH. junta la decisión sugerida de cada colaborador y la agrupa por prioridad: Atención / riesgo (advertencia, suspensión, desvinculación), Reconocer / premiar (reconocimiento, bono, aumento) y Seguimiento (acompañamiento, capacitación); arriba está el conteo de cada grupo y puedes filtrar por departamento. En cada tarjeta ves la acción, el detalle y su "Base"; "Ver perfil" abre a la persona y "Marcar hecha" la pasa a Completadas ("Reabrir" la devuelve). En la demo, lo marcado se olvida al recargar. Empieza siempre por Atención / riesgo.',
    route: '/acciones',
    routeLabel: 'Ir a Acciones RR.HH.',
    topic: 'talent',
  },
  {
    id: 'acciones-reporte',
    question: '¿Cómo envío a un gerente el reporte de su equipo?',
    keywords: [
      'reporte a gerentes', 'reportes a gerentes', 'reporte a gerente', 'reporte al gerente', 'reporte para el gerente', 'reporte de equipo',
      'reporte del equipo', 'reporte de su equipo', 'el reporte del', 'descargar el reporte del', 'gerentes', 'gerente', 'a un gerente', 'al gerente',
      'reporte a un', 'reporte a un gerente', 'el reporte al', 'envio a un gerente', 'gerente de area', 'gerente del area', 'enviar reporte', 'ver / enviar reporte',
      'ver o enviar reporte', 'estado de su equipo', 'estado del equipo', 'whatsapp al gerente', 'reporte por whatsapp', 'descargar reporte',
      'copiar reporte', 'informe', 'informe del equipo', 'informe al gerente', 'resumen del equipo', 'resumen para el gerente',
      'que le mando al gerente', 'avisar al gerente', 'le aviso al gerente', 'reporte de su departamento', 'reporte del departamento',
      'reporte mensual', 'reporte semanal', 'reporte trimestral',
    ],
    answer:
      'En Acciones RR.HH., el bloque "Reportes a gerentes" tiene una tarjeta por departamento con su gerente y cuántas personas tiene a reconocer, en seguimiento y en riesgo. "Ver / enviar reporte" arma el resumen (colaboradores, conteos y cada caso con su acción y su base) y lo puedes mandar al gerente por WhatsApp (se abre el chat con el texto listo), copiarlo o descargarlo como .txt. En la demo, los teléfonos de los gerentes son de ejemplo.',
    route: '/acciones',
    routeLabel: 'Ir a Acciones RR.HH.',
    topic: 'talent',
  },
  {
    id: 'talento-datos',
    question: '¿De dónde salen los datos de Talento y cómo cargo a mis colaboradores?',
    keywords: [
      'de donde salen los datos', 'de donde sale la informacion', 'de donde salen los colaboradores', 'de donde salen las personas',
      'de donde salen los puntajes', 'de donde sale el puntaje', 'de donde salen los numeros', 'salen los datos', 'datos de talento',
      'mis colaboradores', 'cargo a mis', 'como cargo', 'cargar a mi', 'subir a mi', 'subir mi', 'subo la', 'subo los', 'subo las', 'donde subo',
      'plantilla de colaboradores', 'plantilla de kpis', 'plantilla de cultura', 'plantilla de', 'las plantillas', 'que plantillas', 'plantilla', 'plantillas', 'importar', 'importo', 'subir colaboradores',
      'cargar colaboradores', 'cargo colaboradores', 'agregar colaboradores', 'agrego un colaborador', 'agregar un colaborador', 'kpis', 'kpi',
      'evaluacion 360', 'evaluación 360', 'quien evalua', 'quien llena', 'excel', 'como cargo los colaboradores', 'fase 2', 'mi gente',
      'mi equipo de tienda', 'mis vendedores', 'los de mi tienda', 'solo hay 9', 'nueve personas', 'son de ejemplo', 'cambiar los colaboradores',
      'editar un colaborador', 'actualizar los datos', 'subir la evaluacion', 'subir las notas', 'subir los resultados', 'contratado pasa a talento',
      'pasa a talento', 'llega a talento', 'aparece en talento',
    ],
    answer:
      'Por plantillas estándar que la empresa solo llena y sube: Colaboradores (RR.HH.: datos, cargo, departamento, jefe), KPIs de Desempeño (ventas y metas del área) y Cultura 360° (las 10 dimensiones evaluadas por jefe, pares y equipo). No hay configuración: la plantilla es la misma para todos. En la demo son 9 colaboradores de ejemplo (uno por cuadrante) con 6 trimestres inventados y todavía no se pueden cargar los tuyos; la importación real llega con la base de datos de la Fase 2. Quien se contrata en Reclutamiento entrará a Talento con esa importación.',
    route: '/talento',
    routeLabel: 'Ir a Matriz 9-Box',
    topic: 'talent',
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
    id: 'modulos',
    question: '¿Qué son los módulos opcionales?',
    keywords: [
      'modulos opcionales', 'módulos opcionales', 'que modulos', 'que módulos', 'cuales modulos', 'cuáles módulos', 'que son los modulos',
      'que son los módulos', 'hay mas modulos', 'hay más módulos', 'otros modulos', 'otros módulos', 'catalogo de modulos', 'catálogo',
      'catalogo', 'opcionales', 'que es un modulo', 'qué es un módulo', 'que es un modulo opcional', 'cuantos modulos', 'cuántos módulos',
      'modulos hay', 'módulos hay', 'lista de modulos', 'puedo agregar un modulo', 'agregar modulos', 'nuevos modulos', 'mas modulos',
    ],
    answer:
      'Son funciones que la empresa enciende o apaga en Configuración → Módulos opcionales; el catálogo es fijo y no se configura nada más. Hoy el único módulo es Entrevistas IA por videollamada (apagado de inicio): al encenderlo aparece en el menú de Reclutamiento y se abre su ayuda guiada; al apagarlo solo se oculta y no se pierde nada. El flujo base (Vacantes → Screening → Respuestas a CVs → Entrevistas → Candidatos) y las secciones Talento y Gestión siempre están.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'management',
  },
  {
    id: 'preguntas-chat',
    question: '¿Dónde quedan las preguntas que le hago al chat de ayuda?',
    keywords: [
      'preguntas al chat', 'mis preguntas', 'preguntas que hice', 'preguntas que hago', 'preguntas que le hago', 'le hago al chat', 'hago al chat',
      'al chat de ayuda', 'donde quedan', 'quedan las preguntas', 'las preguntas que hago', 'pregunte al chat', 'pregunto al chat', 'quedan guardadas', 'se guardan las preguntas',
      'guardan mis preguntas', 'registro de preguntas', 'sin respuesta', 'borrar preguntas', 'borrar las preguntas', 'copiar preguntas',
      'copiar las preguntas', 'descargar preguntas', 'descargar las preguntas', 'historial de preguntas', 'que pregunte', 'lo que pregunte',
      'lo que pregunto', 'quien ve mis preguntas', 'quien lee', 'se registra', 'quedo registrada', 'quedó registrada', 'registrada',
    ],
    answer:
      'Cada pregunta que haces aquí se guarda en Configuración → "Preguntas al chat de ayuda", con fecha, la pantalla donde la hiciste y si tuvo respuesta ("Sin respuesta" es lo que falta en la guía). Desde ahí "Enviar a Oscar" abre un correo con la lista y espacio para tus comentarios, y también puedes copiarla, descargarla como .txt o borrarla. Solo se guardan en este navegador; nadie las ve hasta que las envías.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'management',
  },
  {
    id: 'restablecer',
    question: '¿Cómo restablezco la demo o empiezo de cero?',
    keywords: [
      'restablecer', 'restablezco', 'restablecer la demo', 'reiniciar la demo', 'reinicio la demo', 'empezar de cero', 'de cero', 'borrar todo',
      'borro todo', 'limpiar', 'limpiar todo', 'resetear', 'reset', 'se rompio', 'se rompió', 'volver al inicio', 'datos originales',
      'como estaba', 'como estaba al principio', 'deshacer todo', 'quitar lo que hice', 'borrar lo que hice', 'dejar como estaba',
      'volver a empezar', 'se me descompuso', 'algo se descompuso', 'se trabo', 'se trabó', 'no carga', 'pantalla en blanco',
    ],
    answer:
      'En Configuración, al pie, "Restablecer la demo en este navegador" borra todo lo que guardaste aquí: metas, equipo agregado, módulos, vacantes creadas, CVs cargados, mensajes enviados, evaluaciones de entrevista, preguntas al chat y el estado del tour, y vuelve a cargar la app con los datos de ejemplo. Solo afecta a este navegador. Si solo quieres volver a las metas de fábrica, usa "Restablecer" en Metas de servicio.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'management',
  },
  {
    id: 'opinado',
    question: '¿Por qué no hay más configuración? ¿Puedo agregar etapas o campos?',
    keywords: [
      'software opinado', 'opinado', 'personalizar', 'personalizacion', 'personalización', 'configuracion flexible', 'mas opciones', 'más opciones',
      'mas configuracion', 'más configuración', 'cambiar el proceso', 'agregar etapa', 'agregar una etapa', 'otra etapa', 'etapa nueva',
      'nueva etapa', 'quitar una etapa', 'agregar campos', 'agregar un campo', 'campo nuevo', 'nuevo campo', 'modificar el proceso',
      'no se puede configurar', 'por que no puedo configurar', 'adaptar la app', 'adaptar el software', 'a la medida', 'a nuestra medida',
      'por que no hay mas', 'donde configuro', 'que se puede configurar', 'que puedo configurar', 'cambiar las columnas', 'cambiar la plantilla',
      'cambiar el mensaje', 'otro mensaje', 'cambiar el orden', 'cambio el orden', 'el orden de', 'orden de las etapas', 'un campo', 'campo a la vacante',
      'agregar un campo a', 'campos a la vacante', 'campos al candidato',
    ],
    answer:
      'TALENTIA es software opinado: el proceso de reclutamiento ya viene definido y la empresa se adapta a él, no al revés. Por eso no hay pantallas de configuración flexible ni etapas o campos a la medida: así nunca se vuelve un revoltijo de configuraciones y todos trabajan igual. Lo único que se decide en Configuración es quién está en el equipo, las metas en días y qué módulos opcionales están encendidos. Si falta un dato o una etapa que de verdad necesitan, anótalo en tus comentarios: se evalúa para el estándar de todos.',
    route: '/configuracion',
    routeLabel: 'Ir a Configuración',
    topic: 'management',
  },
  {
    id: 'tour',
    question: '¿Cómo vuelvo a ver el tour o el video?',
    keywords: [
      'tour', 'video', 'el video', 'los videos', 'guia', 'guía', 'tutorial', 'ayuda', 'aprender', 'capacitacion', 'capacitación',
      'un video', 'ver video', 'video de entrevistas', 'video de las entrevistas', 'ayuda guiada', 'el tutorial',
      'ver la ayuda guiada', 'volver a ver', 'video de talento', 'video de gestion', 'video de metricas', 'recorrido de talento',
      'recorrido de gestion', 'tour de talento', 'tour de gestion', 'tour de metricas', 'recorrido guiado', 'los recorridos',
    ],
    answer:
      'Desde el botón de ayuda (abajo a la derecha): la pestaña "Guía" inicia el tour de Reclutamiento paso a paso, los recorridos de las secciones Talento y Gestión (cada una con su "Cómo funciona") y la ayuda guiada de Entrevistas IA; la pestaña "Video" tiene cuatro videos narrados con capítulos: el recorrido completo (3½ min), Talento (2½ min), Gestión (2½ min) y Entrevistas IA por videollamada (2 min).',
  },
];
