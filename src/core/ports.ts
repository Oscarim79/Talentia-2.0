// ============================================================
//  Puertos (interfaces) de proveedores externos.
//  La UI depende SOLO de estas interfaces, nunca de un proveedor concreto.
//  Demo => adaptadores mock.  Producción => adaptadores reales.
// ============================================================
import type { ParsedCv, EvidenceMatch, InterviewTurn } from '../types';

// ---- Parser de CV (LlamaParse / Document AI en producción) ----
export interface CvParseResult {
  ok: boolean;
  parsed?: ParsedCv;
  errorReason?: string; // 'illegible_pdf' | 'corrupt' | 'password_protected'
}

export interface CvParserPort {
  parse(fileName: string): Promise<CvParseResult>;
}

// ---- LLM (Claude / Gemini en producción) ----
export interface ScoreInput {
  jobTitle: string;
  mustHaves: string[];
  niceToHaves: string[];
  negatives: string[];
  parsed: ParsedCv;
}

export interface ScoreResult {
  score: number; // 0-100
  matchPercent: number; // match semántico 0-100
  justification: string;
  evidence: EvidenceMatch[];
  flags: string[];
}

// ---- Entrevista IA (agente conversacional) ----
export interface InterviewReplyInput {
  history: InterviewTurn[];
  jobTitle: string;
  candidateName: string;
  /** Banco de preguntas aprobado. El agente SOLO pregunta de aquí (tool-constrained). */
  questions: string[];
}

export interface InterviewReplyResult {
  /** Siguiente mensaje del agente. */
  message: string;
  /** true cuando el agente cerró la entrevista. */
  done: boolean;
}

// ---- Plan de crecimiento (7 Hábitos / Franklin Covey) ----
export interface GrowthPlanInput {
  name: string;
  role: string;
  department: string;
  performanceScore: number; // 1-5
  cultureScore: number; // 1-5
  quadrant: string;
  cultureScores: Record<string, number>; // 10 dimensiones 360°
}

export interface GrowthPlanResult {
  habit: string; // ej. "Hábito 3 — Poner primero lo primero"
  focusArea: string; // dimensión/área más débil detectada
  summary: string; // diagnóstico conectando resultados con el hábito
  actions: string[]; // acciones concretas para esta semana
  courses: string[]; // cursos recomendados
}

// ---- Ayuda en la app (chat de soporte) ----
export interface HelpReplyInput {
  question: string;
  /** Ruta actual, para contextualizar la respuesta. */
  route: string;
  /** Módulo desde cuya ayuda se abrió el chat (ej. 'interviewsAi'): sus respuestas tienen prioridad. */
  topic?: string | null;
}

export interface HelpReplyResult {
  answer: string;
  /** false cuando no se encontró respuesta en la guía (se registra para mejorarla). */
  matched: boolean;
  /** Sugerencia de a dónde ir para hacerlo. */
  route?: string;
  routeLabel?: string;
  /** Preguntas relacionadas que el usuario puede tocar. */
  related: string[];
}

export interface LlmPort {
  generateJobDescription(input: {
    title: string;
    department: string;
    seniority: string;
  }): Promise<string>;
  generateInterviewQuestions(input: { title: string; count: number }): Promise<string[]>;
  scoreCandidate(input: ScoreInput): Promise<ScoreResult>;
  interviewReply(input: InterviewReplyInput): Promise<InterviewReplyResult>;
  generateGrowthPlan(input: GrowthPlanInput): Promise<GrowthPlanResult>;
  helpReply(input: HelpReplyInput): Promise<HelpReplyResult>;
}

// ---- Mensajería: WhatsApp (Twilio / Meta) y correo (Resend / SES) en producción ----
export interface MessagingPort {
  sendWhatsApp(input: { to: string; body: string }): Promise<{ id: string; status: string }>;
  sendEmail(input: { to: string; subject: string; body: string }): Promise<{ id: string; status: string }>;
}

// ---- Voz / telefonía (Vapi / Retell en producción) ----
export interface VoicePort {
  startCall(input: { to: string; agentScript: string }): Promise<{ sessionId: string; status: string }>;
}

// ---- Billing (Stripe en producción) ----
export interface BillingPort {
  checkout(input: { tenantId: string; planId: string }): Promise<{ url: string }>;
}
