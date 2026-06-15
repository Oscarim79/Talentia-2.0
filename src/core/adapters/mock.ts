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

  async interviewReply({ history }) {
    const next = history.filter((t) => t.role === 'agent').length;
    const followups = [
      'Gracias. ¿Podrías contarme un ejemplo concreto de una venta difícil que cerraste?',
      'Entiendo. ¿Cómo organizas tu día para cumplir tus metas?',
      'Perfecto. ¿Tienes disponibilidad para trabajar fines de semana?',
      'Excelente. Eso es todo por ahora, un reclutador te contactará. ¡Gracias!',
    ];
    return delay(followups[Math.min(next, followups.length - 1)], 500);
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
