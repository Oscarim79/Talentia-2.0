import type { ModuleId } from '../../core/modules';
import type { HelpVideoId } from './tourSteps';

/**
 * Guía de cada módulo opcional: se muestra al activarlo (ayuda guiada) y desde
 * Ayuda → Guía. Si cambia el módulo, actualizar aquí, en `INTERVIEWS_AI_TOUR_STEPS`
 * (tourSteps.ts), en las preguntas `entrevista*` de `data/helpFaq.ts` y en el
 * guion del video (`docs/video/entrevistas-ia/narration.json`).
 */
export interface ModuleGuide {
  module: ModuleId;
  title: string;
  summary: string;
  /** Cómo funciona, en el orden en que ocurre. */
  howItWorks: { title: string; body: string }[];
  /** Qué le toca hacer a RR.HH. */
  todo: { text: string; route?: string; routeLabel?: string }[];
  /** Qué es simulado en la demo. */
  demoNote: string;
  video: HelpVideoId;
  /** Preguntas del chat de ayuda (ids de `HELP_FAQ`) que se sugieren al abrirlo desde la ayuda del módulo. */
  chatSuggestions: string[];
}

export const MODULE_GUIDES: Record<ModuleId, ModuleGuide> = {
  interviewsAi: {
    module: 'interviewsAi',
    title: 'Entrevistas IA por videollamada',
    summary:
      'Un asistente con inteligencia artificial entrevista por videollamada (Zoom) a los candidatos que agendaste, con las preguntas de la vacante, y te entrega la transcripción y una evaluación. La decisión sigue siendo de RR.HH.',
    howItWorks: [
      {
        title: 'Preguntas de la vacante',
        body: 'El asistente de IA solo hace las preguntas del banco de la vacante, en orden, y no improvisa. Se definen al crear la vacante (paso 4 del formulario, "Preguntas IA").',
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
        title: 'Recibes la evaluación',
        body: 'En Entrevistas IA: puntaje global de 0 a 100, puntaje de 1 a 10 por pregunta y diferencias entre el CV y lo que dijo el candidato.',
      },
      {
        title: 'RR.HH. decide',
        body: 'La evaluación es una recomendación: tú lees la transcripción y decides si el candidato pasa a Oferta o se descarta.',
      },
    ],
    todo: [
      {
        text: 'Revisa que cada vacante abierta tenga sus preguntas (la tarjeta dice cuántas). Hoy no se editan después de crear la vacante; si una no tiene, el asistente usa 3 preguntas generales.',
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
        text: 'Lee cada evaluación antes de decidir; si ves una diferencia con el CV, confírmala con el candidato.',
      },
      {
        text: 'Si decides no usarlo, apaga el módulo en Configuración: solo se oculta del menú y no se pierde nada.',
      },
    ],
    demoNote:
      'La videollamada real (Zoom, con voz) está planeada para la Fase 3; hoy la entrevista se simula con un chat y tú escribes las respuestas del candidato. El puntaje es aproximado (premia respuestas completas que mencionan los requisitos) y la conversación no se guarda al salir de la pantalla. Quien confirma su entrevista en Respuestas a CVs pasa a la etapa Entrevista y aparece en la lista.',
    video: 'interviewsAi',
    chatSuggestions: ['entrevista-ia-como', 'entrevista-ia-pasos', 'entrevista-ia-evaluacion', 'entrevista-ia-aviso'],
  },
};
