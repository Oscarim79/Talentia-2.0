// ============================================================
//  Guía de Entrevista por competencias (Vendedores y Jefes de Tienda).
//  Fuente: "GUÍA DE ENTREVISTA A VENDEDORES Y JEFES DE TIENDA" de RR.HH.
//  de Americana 2000 (Drive: RRHH/INBOUND/FORMATOS).
//
//  Software OPINADO: la metodología es fija (preguntas, escala, clave de
//  opción múltiple, pesos y reglas). La empresa no la configura; si la guía
//  cambia, se cambia aquí y aplica igual a todos los candidatos.
//  El cálculo es puro y determinista (sin IA): mismas respuestas → mismo reporte.
// ============================================================
import type { Job } from '../types';

export type GuideRole = 'vendedor' | 'jefe';

export type CompetencyKey = 'cliente' | 'comunicacion' | 'equipo' | 'problemas' | 'resultados' | 'liderazgo';

export interface Competency {
  key: CompetencyKey;
  label: string;
}

/** Las seis competencias del reporte; la sexta (Liderazgo y Gestión) solo aplica a jefes de tienda. */
export const COMPETENCIES: Competency[] = [
  { key: 'cliente', label: 'Orientación al Cliente' },
  { key: 'comunicacion', label: 'Habilidades de Comunicación' },
  { key: 'equipo', label: 'Trabajo en Equipo y Colaboración' },
  { key: 'problemas', label: 'Capacidad de Resolución de Problemas' },
  { key: 'resultados', label: 'Orientación a Resultados' },
  { key: 'liderazgo', label: 'Liderazgo y Gestión' },
];

export function competencyLabel(key: CompetencyKey): string {
  return COMPETENCIES.find((c) => c.key === key)?.label ?? key;
}

export interface GuideMeta {
  role: GuideRole;
  label: string;
  minutes: number;
}

export const GUIDES: Record<GuideRole, GuideMeta> = {
  vendedor: { role: 'vendedor', label: 'Vendedor', minutes: 45 },
  jefe: { role: 'jefe', label: 'Jefe de Tienda', minutes: 60 },
};

export function competenciesFor(role: GuideRole): Competency[] {
  return role === 'jefe' ? COMPETENCIES : COMPETENCIES.filter((c) => c.key !== 'liderazgo');
}

/**
 * Guía que corresponde a una vacante: la indicada en la vacante o, si no tiene,
 * la que sugiere el título (jefe/encargado/gerente/supervisor → Jefe de Tienda).
 */
export function guideRoleForJob(job: Pick<Job, 'title' | 'interviewGuide'> | undefined): GuideRole {
  if (job?.interviewGuide) return job.interviewGuide;
  return /jef[ea]|encargad|gerente|supervis|administrador/i.test(job?.title ?? '') ? 'jefe' : 'vendedor';
}

// ---------- Escala 1 a 5 (sección 2.A) ----------

export interface ScaleLevel {
  score: number;
  level: string;
  description: string;
}

export const SCALE: ScaleLevel[] = [
  { score: 1, level: 'Insuficiente', description: 'No da un ejemplo concreto, o la conducta que describe es contraria a lo esperado.' },
  { score: 2, level: 'Débil', description: 'El ejemplo es vago o hipotético ("yo haría…"); no queda claro qué hizo ni qué logró.' },
  { score: 3, level: 'Adecuado', description: 'Da un ejemplo concreto con acciones razonables, pero el resultado es poco claro o dependió sobre todo de otros.' },
  { score: 4, level: 'Bueno', description: 'Describe con claridad la situación, sus propias acciones y un resultado positivo.' },
  { score: 5, level: 'Excelente', description: 'Cumple con el nivel 4 y, además, muestra iniciativa más allá de lo esperado, un resultado medible o un aprendizaje que aplicó después.' },
];

/** Repreguntas neutrales para respuestas vagas (no sugieren la respuesta). */
export const FOLLOW_UPS = ['¿Qué hiciste tú específicamente?', '¿Cuál fue el resultado?', '¿Qué harías distinto?'];

/** Si solo habla en plural y no describe acciones propias, el puntaje máximo es 3. */
export const PLURAL_CAP = 3;

/** Instrucciones para el entrevistador (inicio de la guía). */
export const INSTRUCTIONS: { title: string; text: string }[] = [
  { title: 'Orden', text: 'Primero las preguntas conductuales, luego la pregunta basada en una historia y al final las de opción múltiple.' },
  { title: 'Repreguntas', text: 'Si la respuesta es vaga, usa repreguntas neutrales: "¿Qué hiciste tú específicamente?", "¿Cuál fue el resultado?", "¿Qué harías distinto?". No sugieras la respuesta.' },
  { title: 'Notas', text: 'Anota frases textuales del candidato debajo de cada pregunta. Puntúa al terminar la entrevista, no durante ella.' },
  { title: 'Opción múltiple', text: 'El candidato elige una sola opción. No le muestres los puntajes: la app los calcula sola con la clave de la guía.' },
  { title: 'Guía "Busca"', text: 'Debajo de cada pregunta conductual se indica qué evidencia buscar para dar un 4 o un 5.' },
];

// ---------- Preguntas conductuales (2 por competencia) ----------

export interface BehavioralQuestion {
  /** V1–V10 (vendedor) o J1–J12 (jefe de tienda). */
  id: string;
  competency: CompetencyKey;
  text: string;
  /** Evidencia a buscar para dar un 4 o un 5. */
  lookFor: string;
}

export const BEHAVIORAL: Record<GuideRole, BehavioralQuestion[]> = {
  vendedor: [
    { id: 'V1', competency: 'cliente', text: 'Describe una situación donde tuviste que ayudar a un cliente difícil. ¿Cómo lo manejaste?', lookFor: 'Escuchó sin interrumpir, entendió la necesidad real, ofreció alternativas y el cliente se fue satisfecho.' },
    { id: 'V2', competency: 'cliente', text: 'Dame un ejemplo de cómo manejaste una queja de un cliente en el pasado. ¿Qué pasó después?', lookFor: 'Asumió la queja como propia, la resolvió o la escaló a tiempo y dio seguimiento al cliente.' },
    { id: 'V3', competency: 'comunicacion', text: 'Háblame de una vez que tuviste que explicarle un producto, un precio o una política a un cliente que no lo entendía. ¿Cómo lo hiciste?', lookFor: 'Adaptó su lenguaje al cliente, confirmó que le entendió y mantuvo un tono respetuoso.' },
    { id: 'V4', competency: 'comunicacion', text: 'Cuéntame de una ocasión en que convenciste a un cliente indeciso. ¿Qué le dijiste?', lookFor: 'Preguntó antes de recomendar, conectó el producto con la necesidad del cliente y no lo presionó.' },
    { id: 'V5', competency: 'equipo', text: 'Háblame de una ocasión en que trabajaste en equipo para lograr un objetivo en la tienda. ¿Cuál fue tu papel?', lookFor: 'Describe su aporte concreto, apoyó a otros sin que se lo pidieran y el equipo logró el objetivo.' },
    { id: 'V6', competency: 'equipo', text: 'Dame un ejemplo de cómo motivaste o apoyaste a un compañero de trabajo para alcanzar una meta.', lookFor: 'Ofreció ayuda o conocimiento propio, mantuvo una actitud positiva y hubo un resultado visible.' },
    { id: 'V7', competency: 'problemas', text: 'Describe una vez que tuviste que resolver un problema inesperado en la tienda.', lookFor: 'Analizó la situación antes de actuar, tomó una acción concreta y evitó que el problema se repitiera.' },
    { id: 'V8', competency: 'problemas', text: 'Háblame de una situación donde tuviste que manejar varias tareas al mismo tiempo. ¿Cómo decidiste qué hacer primero?', lookFor: 'Priorizó con un criterio claro (por ejemplo, el cliente primero), pidió apoyo cuando lo necesitó y cumplió.' },
    { id: 'V9', competency: 'resultados', text: 'Cuéntame de una vez que lograste alcanzar una meta de ventas. ¿Qué hiciste para lograrlo?', lookFor: 'Acciones propias, un resultado medible (cifra o porcentaje) y su aporte individual, no solo el del equipo.' },
    { id: 'V10', competency: 'resultados', text: 'Cuéntame sobre un momento en que aprendiste algo nuevo para vender mejor. ¿Qué resultado tuvo?', lookFor: 'Buscó aprender por iniciativa propia, lo aplicó y puede mostrar una mejora concreta.' },
  ],
  jefe: [
    { id: 'J1', competency: 'cliente', text: 'Cuéntame sobre una vez que lograste aumentar la satisfacción de los clientes en tu tienda. ¿Cómo supiste que había mejorado?', lookFor: 'Identificó la causa de la insatisfacción, cambió algo en la operación y lo midió (encuestas, quejas, clientes recurrentes).' },
    { id: 'J2', competency: 'cliente', text: 'Describe una ocasión en que un cliente pidió hablar con el encargado por una queja. ¿Cómo la resolviste y qué cambiaste después?', lookFor: 'Resolvió sin desautorizar a su equipo y aprovechó el caso para corregir el proceso o capacitar.' },
    { id: 'J3', competency: 'comunicacion', text: 'Háblame de una vez que tuviste que comunicar a tu equipo un cambio o una noticia difícil. ¿Cómo lo hiciste?', lookFor: 'Explicó el porqué, escuchó las dudas del equipo y confirmó que el mensaje se entendió.' },
    { id: 'J4', competency: 'comunicacion', text: 'Háblame de una situación donde tuviste que negociar con un cliente, un proveedor o tu jefe para llegar a un acuerdo.', lookFor: 'Preparó argumentos, buscó un acuerdo en el que ambas partes ganaran y cerró con un resultado concreto.' },
    { id: 'J5', competency: 'equipo', text: 'Cuéntame de una vez que tuviste que coordinarte con otra área o con otra tienda para resolver algo.', lookFor: 'Tomó la iniciativa de coordinar, compartió información a tiempo y priorizó el resultado de la empresa sobre el de su tienda.' },
    { id: 'J6', competency: 'equipo', text: 'Cuéntame sobre un momento en el que tuviste que adaptarte junto con tu equipo a un cambio en la tienda.', lookFor: 'Se adaptó rápido, ayudó al equipo a hacerlo y mantuvo la operación funcionando durante el cambio.' },
    { id: 'J7', competency: 'problemas', text: 'Dame un ejemplo de un problema de inventario o de control de existencias que detectaste. ¿Cómo lo resolviste?', lookFor: 'Encontró la causa (no solo el síntoma), corrigió el proceso y redujo faltantes o diferencias.' },
    { id: 'J8', competency: 'problemas', text: 'Describe una jornada en la que tuviste más tareas de las que podías atender. ¿Cómo decidiste qué hacer primero y qué delegar?', lookFor: 'Priorizó con criterio, delegó según las capacidades de su equipo y dio seguimiento a lo delegado.' },
    { id: 'J9', competency: 'resultados', text: 'Cuéntame sobre un momento en que identificaste una oportunidad para aumentar las ventas y qué hiciste al respecto.', lookFor: 'Detectó la oportunidad con datos u observación, actuó y puede dar una cifra del resultado.' },
    { id: 'J10', competency: 'resultados', text: 'Cuéntame de una vez que tu tienda iba por debajo de la meta. ¿Qué hiciste para recuperarla?', lookFor: 'Analizó la causa, ajustó la estrategia con su equipo y dio seguimiento diario o semanal al avance.' },
    { id: 'J11', competency: 'liderazgo', text: 'Háblame de una ocasión en que dirigiste a tu equipo para superar un desafío en la tienda.', lookFor: 'Asignó responsabilidades claras, motivó al equipo, dio seguimiento y reconoció el esfuerzo al final.' },
    { id: 'J12', competency: 'liderazgo', text: 'Describe una vez que tuviste que capacitar a un nuevo empleado. ¿Cómo lo hiciste y cómo supiste que estaba listo?', lookFor: 'Tuvo un plan de capacitación, practicó con el empleado, le dio retroalimentación y verificó su desempeño.' },
  ],
};

// ---------- Opción múltiple (1 por competencia; clave de la sección 2.B) ----------

export type ChoiceLetter = 'A' | 'B' | 'C';

export interface ChoiceQuestion {
  /** M1–M6. */
  id: string;
  n: number;
  competency: CompetencyKey;
  prompt: string;
  /** Puntos: la mejor 5, la intermedia 3, la menos adecuada 1. Nunca se muestran al candidato. */
  options: { letter: ChoiceLetter; text: string; points: 1 | 3 | 5 }[];
}

export const CHOICE_QUESTIONS: ChoiceQuestion[] = [
  {
    id: 'M1', n: 1, competency: 'cliente',
    prompt: 'Un cliente molesto quiere cambiar un producto, pero tú no tienes autorización para hacer cambios. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Le explico la política de la tienda y le indico que no es posible el cambio.', points: 1 },
      { letter: 'B', text: 'Lo escucho, reviso su caso y gestiono con el encargado una solución mientras lo acompaño.', points: 5 },
      { letter: 'C', text: 'Lo envío con el encargado para que él lo atienda.', points: 3 },
    ],
  },
  {
    id: 'M2', n: 2, competency: 'comunicacion',
    prompt: 'Un cliente te pregunta por un producto que no conoces bien. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Le doy la información que creo correcta para no hacerlo esperar.', points: 1 },
      { letter: 'B', text: 'Le digo que no conozco ese producto y le sugiero leer la etiqueta.', points: 3 },
      { letter: 'C', text: 'Le digo con honestidad que lo voy a confirmar, consulto con un compañero o la ficha del producto y se lo explico con claridad.', points: 5 },
    ],
  },
  {
    id: 'M3', n: 3, competency: 'equipo',
    prompt: 'Ya terminaste tus tareas y tus compañeros siguen ocupados. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Aprovecho para ordenar mi área y adelantar trabajo del día siguiente.', points: 3 },
      { letter: 'B', text: 'Pregunto a mis compañeros dónde puedo apoyar y ayudo donde más se necesita.', points: 5 },
      { letter: 'C', text: 'Espero a que el encargado me asigne otra tarea.', points: 1 },
    ],
  },
  {
    id: 'M4', n: 4, competency: 'problemas',
    prompt: 'Es hora pico: hay clientes esperando, acaba de llegar mercadería que hay que acomodar y suena el teléfono. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Atiendo primero a los clientes, pido apoyo para el teléfono y acomodo la mercadería cuando baje la afluencia.', points: 5 },
      { letter: 'B', text: 'Acomodo rápido la mercadería para despejar el área y luego atiendo a los clientes.', points: 1 },
      { letter: 'C', text: 'Atiendo a los clientes en el orden en que llegan y dejo todo lo demás para el final del turno.', points: 3 },
    ],
  },
  {
    id: 'M5', n: 5, competency: 'resultados',
    prompt: 'A mitad de mes llevas el 40 % de tu meta de ventas. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Sigo trabajando igual; la segunda quincena suele ser mejor.', points: 1 },
      { letter: 'B', text: 'Me esfuerzo en atender a más clientes cada día.', points: 3 },
      { letter: 'C', text: 'Reviso qué productos y horarios me están funcionando, pido consejos a los mejores vendedores y ajusto mi forma de vender.', points: 5 },
    ],
  },
  {
    id: 'M6', n: 6, competency: 'liderazgo',
    prompt: 'Un vendedor con buen historial lleva dos semanas por debajo de su meta y llegando tarde. ¿Qué haces?',
    options: [
      { letter: 'A', text: 'Le llamo la atención frente al equipo para que todos vean que las reglas aplican para todos.', points: 1 },
      { letter: 'B', text: 'Hablo con él en privado, escucho qué está pasando, acordamos un plan y le doy seguimiento.', points: 5 },
      { letter: 'C', text: 'Le doy tiempo; como tiene buen historial, seguramente se recuperará solo.', points: 3 },
    ],
  },
];

export function choiceQuestionsFor(role: GuideRole): ChoiceQuestion[] {
  const keys = new Set(competenciesFor(role).map((c) => c.key));
  return CHOICE_QUESTIONS.filter((q) => keys.has(q.competency));
}

// ---------- Pregunta basada en una historia (sección 2.C) ----------

export type StoryVariant = 'main' | 'alternate';

export const STORY = {
  main: 'Cuéntame una historia sobre una vez que ayudaste a un cliente a encontrar el producto que necesitaba y cómo eso impactó en la venta y en la satisfacción del cliente.',
  alternate: 'Cuéntame una historia sobre una vez que lograste solucionar la situación de un cliente que estaba insatisfecho por un producto defectuoso.',
  alternateWhen: 'Úsala solo si el candidato no tiene un ejemplo para la pregunta principal.',
  howTo: 'Deja que el candidato cuente la historia completa sin interrumpir y luego usa repreguntas si falta información.',
  /** Aporta evidencia a cuatro competencias a la vez (cada criterio se puntúa de 1 a 5). */
  criteria: [
    { competency: 'cliente', text: '¿Se enfocó en entender las necesidades del cliente antes de ofrecerle un producto?' },
    { competency: 'comunicacion', text: '¿Explicó con claridad y adaptó su lenguaje al cliente?' },
    { competency: 'problemas', text: '¿Cómo resolvió la necesidad o el obstáculo que tenía el cliente?' },
    { competency: 'resultados', text: '¿Su acción contribuyó a concretar la venta? ¿Menciona un resultado concreto?' },
  ] as { competency: CompetencyKey; text: string }[],
  /** Con la pregunta alterna, Orientación a Resultados evalúa otra cosa. */
  alternateResults: '¿Logró conservar al cliente o concretar una venta?',
};

// ---------- Pesos del Índice General por puesto (sección 2.D) ----------

export const WEIGHTS: Record<GuideRole, Partial<Record<CompetencyKey, number>>> = {
  vendedor: { cliente: 0.3, comunicacion: 0.2, equipo: 0.15, problemas: 0.15, resultados: 0.2 },
  jefe: { cliente: 0.2, comunicacion: 0.15, equipo: 0.1, problemas: 0.15, resultados: 0.15, liderazgo: 0.25 },
};

/** La opción múltiple pesa 20 %: es más fácil de adivinar; las conductuales son la evidencia principal. */
export const BEHAVIORAL_WEIGHT = 0.8;
export const CHOICE_WEIGHT = 0.2;

export type RecommendationLevel = 'recommended' | 'reservations' | 'not';

export const RECOMMENDATION_LABEL: Record<RecommendationLevel, string> = {
  recommended: 'Recomendado',
  reservations: 'Recomendado con reservas',
  not: 'No recomendado',
};

export const RECOMMENDATION_HINT: Record<RecommendationLevel, string> = {
  recommended: 'Puede avanzar a oferta.',
  reservations: 'Se sugiere una segunda entrevista o verificar referencias.',
  not: 'No avanza en este proceso.',
};

// ---------- Evaluación de un candidato ----------

export interface InterviewEvaluation {
  candidateId: string;
  tenantId: string;
  jobId: string;
  role: GuideRole;
  /** Persona de RR.HH. que entrevistó. */
  interviewerId: string;
  /** Fecha de la entrevista (AAAA-MM-DD). */
  date: string;
  status: 'draft' | 'done';
  /** Notas textuales por pregunta conductual (V1…/J1…) y de la historia ('story'). */
  notes: Record<string, string>;
  /** Puntaje 1-5 por pregunta conductual. */
  behavioral: Record<string, number>;
  /** Preguntas en que el candidato habló solo en plural, sin acciones propias (tope de 3). */
  pluralOnly: Record<string, boolean>;
  storyVariant: StoryVariant;
  /** Puntaje 1-5 de cada criterio de la historia, por competencia. */
  story: Partial<Record<CompetencyKey, number>>;
  /** Opción elegida por el candidato en cada pregunta de opción múltiple (M1…). */
  choices: Record<string, ChoiceLetter>;
  /** Observaciones por competencia (van al reporte). */
  observations: Partial<Record<CompetencyKey, string>>;
  updatedAt: string;
}

export function emptyEvaluation(p: Pick<InterviewEvaluation, 'candidateId' | 'tenantId' | 'jobId' | 'role' | 'interviewerId' | 'date'>): InterviewEvaluation {
  return { ...p, status: 'draft', notes: {}, behavioral: {}, pluralOnly: {}, storyVariant: 'main', story: {}, choices: {}, observations: {}, updatedAt: new Date().toISOString() };
}

/** true si todavía no se escribió ni puntuó nada (se puede cambiar de guía sin perder trabajo). */
export function isBlank(ev: InterviewEvaluation): boolean {
  return (
    !Object.values(ev.notes).some((n) => n.trim()) &&
    !Object.keys(ev.behavioral).length &&
    !Object.keys(ev.story).length &&
    !Object.keys(ev.choices).length &&
    !Object.values(ev.observations).some((o) => o?.trim())
  );
}

// ---------- Cálculo (sección 2.D) ----------

export interface CompetencyResult {
  key: CompetencyKey;
  label: string;
  /** Puntajes de las dos conductuales (con el tope de 3 aplicado). */
  behavioral: (number | null)[];
  /** Criterio de la historia (solo cliente, comunicación, problemas y resultados). */
  story: number | null;
  storyApplies: boolean;
  /** Puntos de la opción múltiple (5, 3 o 1). */
  choice: number | null;
  choiceLetter: ChoiceLetter | null;
  /** Promedio conductual (conductuales + historia), sin redondear. */
  behavioralAvg: number | null;
  /** Puntaje de la competencia (1 decimal); null mientras falte algún dato. */
  score: number | null;
  weight: number;
}

export interface EvaluationResult {
  role: GuideRole;
  competencies: CompetencyResult[];
  /** Puntajes que faltan para completar el reporte. */
  missing: number;
  total: number;
  complete: boolean;
  /** Índice General de 1 a 5 (1 decimal); null mientras falten puntajes. */
  index: number | null;
  /** Índice como porcentaje: (índice ÷ 5) × 100. */
  percent: number | null;
  /** Recomendación por el índice, antes de aplicar los mínimos obligatorios. */
  baseLevel: RecommendationLevel | null;
  level: RecommendationLevel | null;
  /** Por qué la recomendación quedó así (incluye los mínimos que se aplicaron). */
  reasons: string[];
  strengths: CompetencyResult[];
  improvements: CompetencyResult[];
}

const round = (x: number, d: number) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;
/** Redondeo a 1 decimal pasando por 2 (como la guía: 4.175 → 4.18 ≈ 4.2). */
export const round1 = (x: number) => round(round(x, 2), 1);

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function fmt1(x: number): string {
  return x.toFixed(1);
}

function levelFromIndex(index: number): RecommendationLevel {
  if (index >= 4) return 'recommended';
  if (index >= 3) return 'reservations';
  return 'not';
}

/** "Comunicación (2.8), Liderazgo y Gestión (2.1)" → con "y" antes del último. */
function listOf(cs: CompetencyResult[]): string {
  const xs = cs.map((c) => `${c.label} (${fmt1(c.score!)})`);
  return xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0];
}

const DOWN: Record<RecommendationLevel, RecommendationLevel> = { recommended: 'reservations', reservations: 'not', not: 'not' };

/**
 * Calcula el reporte de competencias con las reglas de la guía.
 * `role` permite calcular el índice de otro puesto con los mismos puntajes
 * (ej. a un candidato a Jefe de Tienda también se le puede leer como Vendedor).
 */
export function scoreEvaluation(ev: InterviewEvaluation, role: GuideRole = ev.role): EvaluationResult {
  const questions = BEHAVIORAL[ev.role];
  const weights = WEIGHTS[role];
  let missing = 0;
  let total = 0;

  const competencies: CompetencyResult[] = competenciesFor(role).map(({ key, label }) => {
    const qs = questions.filter((q) => q.competency === key);
    const behavioral = qs.map((q) => {
      const s = ev.behavioral[q.id];
      return s == null ? null : ev.pluralOnly[q.id] ? Math.min(s, PLURAL_CAP) : s;
    });
    const storyApplies = STORY.criteria.some((c) => c.competency === key);
    const story = storyApplies ? (ev.story[key] ?? null) : null;
    const cq = CHOICE_QUESTIONS.find((q) => q.competency === key);
    const choiceLetter = cq ? (ev.choices[cq.id] ?? null) : null;
    const choice = cq && choiceLetter ? (cq.options.find((o) => o.letter === choiceLetter)?.points ?? null) : null;

    const parts = [...behavioral, ...(storyApplies ? [story] : [])];
    total += parts.length + 1;
    missing += parts.filter((p) => p == null).length + (choice == null ? 1 : 0);

    const given = parts.filter((p): p is number => p != null);
    const behavioralAvg = given.length === parts.length && given.length ? avg(given) : null;
    const score = behavioralAvg != null && choice != null ? round1(behavioralAvg * BEHAVIORAL_WEIGHT + choice * CHOICE_WEIGHT) : null;
    return { key, label, behavioral, story, storyApplies, choice, choiceLetter, behavioralAvg, score, weight: weights[key] ?? 0 };
  });

  const complete = missing === 0;
  const index = complete ? round1(competencies.reduce((s, c) => s + (c.score ?? 0) * c.weight, 0)) : null;
  const percent = index != null ? Math.round((index / 5) * 100) : null;

  let baseLevel: RecommendationLevel | null = null;
  let level: RecommendationLevel | null = null;
  const reasons: string[] = [];
  if (index != null) {
    baseLevel = levelFromIndex(index);
    level = baseLevel;
    reasons.push(`Índice General ${fmt1(index)} → ${RECOMMENDATION_LABEL[baseLevel]} (4.0 a 5.0 recomendado; 3.0 a 3.9 con reservas; menos de 3.0 no recomendado).`);
    // Mínimo obligatorio 1: cualquier competencia debajo de 3.0 baja la recomendación un nivel.
    const low = competencies.filter((c) => (c.score ?? 0) < 3);
    if (low.length && level !== 'not') {
      level = DOWN[level];
      reasons.push(`${listOf(low)} ${low.length > 1 ? 'tienen' : 'tiene'} menos de 3.0: la recomendación baja un nivel.`);
    }
    // Mínimo obligatorio 2: Orientación al Cliente (y Liderazgo y Gestión, en jefe de tienda) debajo de 2.5 → No recomendado.
    const critical = competencies.filter((c) => (c.key === 'cliente' || c.key === 'liderazgo') && (c.score ?? 0) < 2.5);
    if (critical.length) {
      level = 'not';
      reasons.push(`${listOf(critical)} ${critical.length > 1 ? 'tienen' : 'tiene'} menos de 2.5: queda como No recomendado sin importar el Índice General.`);
    }
  }

  const scored = competencies.filter((c) => c.score != null);
  const strengths = [...scored].filter((c) => c.score! >= 4).sort((a, b) => b.score! - a.score!).slice(0, 3);
  const improvements = [...scored].filter((c) => c.score! < 4).sort((a, b) => a.score! - b.score!).slice(0, 3);

  return { role, competencies, missing, total, complete, index, percent, baseLevel, level, reasons, strengths, improvements };
}

/** Cuántos datos lleva capturados la evaluación (para mostrar el avance). */
export function progressOf(ev: InterviewEvaluation): { done: number; total: number } {
  const r = scoreEvaluation(ev);
  return { done: r.total - r.missing, total: r.total };
}
