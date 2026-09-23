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
      'Un asistente de IA entrevista por videollamada a los candidatos que ya agendaste, con las preguntas de la vacante, y te entrega la transcripción y una evaluación. La decisión sigue siendo de RR.HH.',
    howItWorks: [
      {
        title: 'Preguntas de la vacante',
        body: 'El asistente solo hace las preguntas del banco de la vacante (paso 4 del asistente de Vacantes), en orden. No improvisa.',
      },
      {
        title: 'Agendas como siempre',
        body: 'Desde Respuestas a CVs, con modalidad Videollamada: el candidato elige uno de los dos horarios y recibe el enlace.',
      },
      {
        title: 'El asistente entrevista',
        body: 'A la hora acordada entra a la videollamada, se presenta como asistente de entrevistas y hace las preguntas una por una. Todo queda transcrito.',
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
        text: 'Revisa que cada vacante abierta tenga sus preguntas de entrevista (la tarjeta de la vacante dice cuántas tiene).',
        route: '/vacantes',
        routeLabel: 'Ir a Vacantes',
      },
      {
        text: 'Al agendar, deja la modalidad en Videollamada y avisa en "Indicaciones" que lo entrevistará el asistente de IA y que la entrevista se grabará para evaluarla.',
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
        text: 'Si deciden no usarla, apágala en Configuración: solo se oculta del menú y no se pierde nada.',
      },
    ],
    demoNote:
      'En esta demo la videollamada todavía no está conectada: la entrevista se simula con un chat y tú escribes las respuestas del candidato. Con los proveedores reales, el asistente entra a la videollamada con voz, graba y transcribe.',
    video: 'interviewsAi',
    chatSuggestions: ['entrevista-ia-como', 'entrevista-ia-pasos', 'entrevista-ia-evaluacion', 'entrevista-ia-aviso'],
  },
};
