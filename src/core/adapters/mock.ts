// ============================================================
//  Adaptadores MOCK — implementan los puertos sin proveedor real.
//  Todo el comportamiento "IA" aquí es simulado pero realista, para
//  que la demo funcione sin claves ni costos. Reemplazar por adaptadores
//  reales (Claude, LlamaParse, Twilio, Vapi, Stripe) en producción.
// ============================================================
import type {
  CvParserPort,
  CvParseResult,
  LlmPort,
  ScoreInput,
  ScoreResult,
  InterviewReplyResult,
  GrowthPlanInput,
  GrowthPlanResult,
  MessagingPort,
  VoicePort,
  BillingPort,
} from '../ports';
import type { ParsedCv } from '../../types';
import { hashString } from '../../lib/utils';

const SKILLS = [
  'Ventas', 'Atención al cliente', 'Negociación', 'CRM', 'Excel',
  'Motocicletas', 'Crédito', 'Cobranza', 'Liderazgo', 'Inglés',
  'Logística', 'Inventarios', 'Call center', 'Seguros', 'Caja',
];
const COMPANIES = ['Distribuidora El Sol', 'MultiMotos', 'Banco Industrial', 'Tigo', 'Walmart GT', 'Seguros G&T'];
const ROLES = ['Asesor de Ventas', 'Cajero', 'Supervisor', 'Agente de Call Center', 'Ejecutivo de Crédito'];
const EDU = ['Bachillerato', 'Perito Contador', 'Diversificado', 'Universidad (en curso)', 'Licenciatura'];

function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function fabricateParsed(fileName: string): ParsedCv {
  const h = hashString(fileName);
  const skillCount = 3 + (h % 4);
  const skills = Array.from({ length: skillCount }, (_, i) => pick(SKILLS, h + i * 7));
  const totalYears = 1 + (h % 9);
  const expCount = 1 + (h % 3);
  const experience = Array.from({ length: expCount }, (_, i) => ({
    company: pick(COMPANIES, h + i * 3),
    role: pick(ROLES, h + i * 5),
    years: 1 + ((h + i) % 5),
  }));
  return {
    skills: [...new Set(skills)],
    experience,
    totalYears,
    education: pick(EDU, h),
  };
}

// ---------- Parser de CV ----------
export const mockCvParser: CvParserPort = {
  async parse(fileName: string): Promise<CvParseResult> {
    const lower = fileName.toLowerCase();
    // Simula PDFs ilegibles (escaneos/fotos) -> cola de errores
    if (lower.includes('scan') || lower.includes('foto') || lower.includes('imagen')) {
      return delay({ ok: false, errorReason: 'illegible_pdf' }, 700);
    }
    return delay({ ok: true, parsed: fabricateParsed(fileName) }, 700);
  },
};

// ---- 7 Hábitos (Franklin Covey): catálogo, diagnóstico y razón ----
const DIMENSION_LABELS: Record<string, string> = {
  clarity: 'Claridad y alineación',
  inspiration: 'Inspiración al logro',
  empowerment: 'Empoderamiento',
  integrity: 'Integridad y coherencia',
  feedback: 'Calidad del feedback',
  support: 'Soporte y trabajo en equipo',
  transparency: 'Transparencia',
  mentoring: 'Mentoring / Coaching',
  emotional: 'Inteligencia emocional',
  conflict: 'Resolución de conflictos',
};

interface Habit {
  habit: string;
  actions: string[];
  courses: string[];
}

const HABITS: Record<string, Habit> = {
  h1: {
    habit: 'Hábito 1 — Ser proactivo',
    actions: [
      'Identificar una situación reciente donde reaccionó en vez de elegir su respuesta, y replantearla.',
      'Definir su "círculo de influencia" de la semana: 3 cosas que SÍ puede cambiar.',
    ],
    courses: ['Proactividad y responsabilidad personal', 'Inteligencia emocional en el trabajo'],
  },
  h2: {
    habit: 'Hábito 2 — Empezar con un fin en mente',
    actions: [
      'Escribir su meta del trimestre en una frase y tenerla visible en su estación de trabajo.',
      'Acordar con su jefe 2 indicadores claros de éxito para el mes.',
    ],
    courses: ['Gestión de metas y OKRs', 'Liderazgo efectivo y toma de decisiones'],
  },
  h3: {
    habit: 'Hábito 3 — Poner primero lo primero',
    actions: [
      'Bloquear las 2 primeras horas del día para las tareas de mayor impacto en ventas.',
      'Usar una lista "importante vs. urgente" cada mañana esta semana.',
    ],
    courses: ['Gestión del tiempo y productividad', 'Técnicas de cierre de ventas'],
  },
  h4: {
    habit: 'Hábito 4 — Pensar en ganar-ganar',
    actions: [
      'En el próximo desacuerdo, proponer una opción que beneficie a ambas partes antes de defender la suya.',
      'Reconocer públicamente el aporte de un compañero esta semana.',
    ],
    courses: ['Manejo de conflictos y resolución de problemas', 'Negociación colaborativa'],
  },
  h5: {
    habit: 'Hábito 5 — Buscar primero entender, luego ser entendido',
    actions: [
      'En cada interacción con cliente, parafrasear su necesidad antes de ofrecer la solución.',
      'Pedir feedback a 2 compañeros sobre cómo lo perciben y escuchar sin justificar.',
    ],
    courses: ['Escucha activa y comunicación', 'Servicio al cliente de excelencia'],
  },
  h6: {
    habit: 'Hábito 6 — Sinergizar',
    actions: [
      'Proponer una mejora de proceso junto con otra área esta semana.',
      'Aportar una idea concreta en la próxima reunión de equipo.',
    ],
    courses: ['Trabajo en equipo de alto desempeño', 'Colaboración entre áreas'],
  },
  h7: {
    habit: 'Hábito 7 — Afilar la sierra',
    actions: [
      'Dedicar 30 min/semana a una capacitación o lectura de su área.',
      'Fijar una meta de desarrollo personal para el trimestre.',
    ],
    courses: ['Aprendizaje continuo', 'Bienestar y manejo del estrés'],
  },
};

const COVEY_RATIONALE: Record<string, string> = {
  h1: 'asumir el control de su actitud y enfocarse en lo que sí puede influir.',
  h2: 'definir metas claras que le den dirección y sentido a su esfuerzo.',
  h3: 'priorizar lo importante sobre lo urgente para convertir su potencial en resultados.',
  h4: 'construir acuerdos donde todos ganan y fortalecer la relación con su equipo.',
  h5: 'escuchar y entender mejor a clientes y compañeros antes de responder.',
  h6: 'colaborar con otras áreas para lograr más de lo que lograría en solitario.',
  h7: 'invertir en su propio crecimiento para sostener y elevar su desempeño.',
};

function diagnoseHabit(input: GrowthPlanInput): { key: string; focusKey: string } {
  const { performanceScore: perf, cultureScore: cult, cultureScores } = input;
  const weakest = Object.entries(cultureScores).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'clarity';

  // Reglas por balance desempeño/cultura (como en Talentia 1.0)
  if (perf < 3 && cult < 3) return { key: 'h1', focusKey: weakest };
  if (perf < 3 && cult >= 4) return { key: 'h3', focusKey: weakest };
  if (perf >= 4 && cult < 3.5) return { key: 'h5', focusKey: weakest };

  // Reglas por dimensión 360° más débil
  const byDim: Record<string, string> = {
    clarity: 'h2', inspiration: 'h2',
    empowerment: 'h1', integrity: 'h1',
    feedback: 'h5', mentoring: 'h5',
    support: 'h6', transparency: 'h6',
    conflict: 'h4', emotional: 'h7',
  };
  return { key: byDim[weakest] ?? 'h7', focusKey: weakest };
}

// ---------- LLM ----------
export const mockLlm: LlmPort = {
  async generateJobDescription({ title, department, seniority }) {
    const text = `## ${title}\n\n**Departamento:** ${department} · **Nivel:** ${seniority}\n\nBuscamos un(a) **${title}** orientado(a) a resultados para sumarse a nuestro equipo. Será responsable de impulsar las metas del área, brindar una experiencia excepcional al cliente y trabajar de forma colaborativa.\n\n**Responsabilidades**\n- Cumplir y superar las metas asignadas.\n- Gestionar la cartera de clientes y dar seguimiento posventa.\n- Mantener registros precisos en el CRM.\n\n**Requisitos**\n- Experiencia comprobable en el área.\n- Excelente comunicación y actitud de servicio.\n- Disponibilidad inmediata.\n\n*Descripción generada por IA — editable.*`;
    return delay(text, 900);
  },

  async generateInterviewQuestions({ title, count }) {
    const base = [
      `¿Qué experiencia tienes relacionada con el puesto de ${title}?`,
      '¿Cómo manejas una objeción difícil de un cliente?',
      'Cuéntame de una meta que hayas superado y cómo lo lograste.',
      '¿Por qué quieres trabajar con nosotros?',
      '¿Cuál es tu expectativa salarial y disponibilidad?',
      'Describe una situación de conflicto en equipo y cómo la resolviste.',
    ];
    return delay(base.slice(0, count), 800);
  },

  async scoreCandidate(input: ScoreInput): Promise<ScoreResult> {
    const { mustHaves, niceToHaves, negatives, parsed } = input;
    const skillsLower = parsed.skills.map((s) => s.toLowerCase());

    const evidence = mustHaves.map((criterion) => {
      const matched = skillsLower.some((s) => criterion.toLowerCase().includes(s) || s.includes(criterion.toLowerCase().split(' ')[0]));
      return {
        criterion,
        matched,
        quote: matched
          ? `"${parsed.experience[0]?.role ?? 'Experiencia'} en ${parsed.experience[0]?.company ?? 'empresa previa'} — ${parsed.totalYears} años"`
          : '— sin evidencia en el CV —',
      };
    });

    const matchedCount = evidence.filter((e) => e.matched).length;
    const mustScore = mustHaves.length ? (matchedCount / mustHaves.length) * 65 : 50;
    const yearsScore = (Math.min(parsed.totalYears, 8) / 8) * 25;
    const niceBonus = niceToHaves.length ? 10 : 5;

    // filtros negativos (rechazo)
    const flags: string[] = [];
    const h = hashString(parsed.education + parsed.totalYears);
    let penalty = 0;
    if (negatives.length && h % 5 === 0) {
      flags.push(`Posible criterio excluyente: ${negatives[0]}`);
      penalty = 40;
    }

    const score = Math.max(5, Math.min(98, Math.round(mustScore + yearsScore + niceBonus - penalty)));
    const matchPercent = Math.max(10, Math.min(99, Math.round((matchedCount / Math.max(mustHaves.length, 1)) * 100 - penalty / 2)));

    const justification =
      penalty > 0
        ? `Candidato con ${parsed.totalYears} años de experiencia, pero se detectó un criterio excluyente. Revisar antes de avanzar.`
        : `Cumple ${matchedCount}/${mustHaves.length} requisitos clave con ${parsed.totalYears} años de experiencia (${parsed.experience[0]?.company ?? 'previa'}). ${matchedCount >= mustHaves.length ? 'Perfil fuerte, recomendado para entrevista.' : 'Perfil parcial, evaluar en entrevista.'}`;

    return delay({ score, matchPercent, justification, evidence, flags }, 600);
  },

  async interviewReply({ history, jobTitle, candidateName, questions }): Promise<InterviewReplyResult> {
    // Cuántas preguntas ha hecho ya el agente (la apertura incluye la primera).
    const asked = history.filter((t) => t.role === 'agent').length;
    const firstName = candidateName.split(' ')[0] || 'candidato';

    // Apertura: saludo + primera pregunta del banco aprobado.
    if (asked === 0) {
      const opener = questions.length
        ? `¡Hola ${firstName}! Soy el asistente de entrevistas de TALENTIA para la vacante de **${jobTitle}**. Te haré ${questions.length} preguntas cortas; responde con naturalidad.\n\n${questions[0]}`
        : `¡Hola ${firstName}! Soy el asistente de entrevistas de TALENTIA para la vacante de **${jobTitle}**. Cuéntame, ¿por qué te interesa este puesto?`;
      return delay({ message: opener, done: false }, 700);
    }

    // El agente SOLO pregunta del banco aprobado (tool-constrained, no improvisa).
    if (asked < questions.length) {
      return delay({ message: questions[asked], done: false }, 650);
    }

    // Banco agotado → cierre de la entrevista.
    return delay(
      {
        message: `Gracias por tus respuestas, ${firstName}. Con esto concluyo la entrevista — un reclutador las revisará y te contactará pronto. ¡Mucho éxito! 👋`,
        done: true,
      },
      650,
    );
  },

  async generateGrowthPlan(input: GrowthPlanInput): Promise<GrowthPlanResult> {
    const { key, focusKey } = diagnoseHabit(input);
    const h = HABITS[key];
    const first = input.name.split(' ')[0];
    const focusArea = DIMENSION_LABELS[focusKey] ?? 'desarrollo profesional';
    const focusVal = input.cultureScores[focusKey];
    const summary =
      `${first} se ubica en el cuadrante "${input.quadrant}" (desempeño ${input.performanceScore.toFixed(1)}/5, ` +
      `cultura ${input.cultureScore.toFixed(1)}/5). Su mayor área de oportunidad es "${focusArea}" ` +
      `(${focusVal?.toFixed(1) ?? '—'}/5). El enfoque de este periodo es ${h.habit}: ${COVEY_RATIONALE[key]}`;
    return delay({ habit: h.habit, focusArea, summary, actions: h.actions, courses: h.courses }, 900);
  },
};

// ---------- WhatsApp ----------
export const mockMessaging: MessagingPort = {
  async sendWhatsApp({ to }) {
    return delay({ id: `wamid.mock.${hashString(to)}`, status: 'queued' }, 300);
  },
};

// ---------- Voz / telefonía ----------
export const mockVoice: VoicePort = {
  async startCall({ to }) {
    return delay({ sessionId: `call_mock_${hashString(to)}`, status: 'ringing' }, 300);
  },
};

// ---------- Billing ----------
export const mockBilling: BillingPort = {
  async checkout() {
    return delay({ url: '#demo-checkout' }, 300);
  },
};
