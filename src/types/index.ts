// ============================================================
//  TALENTIA 2.0 — Modelo de dominio
// ============================================================

// ---------- Núcleo multi-tenant ----------
export type PlanTier = 'free' | 'starter' | 'growth' | 'scale';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  monthlyPriceUsd: number;
  limits: {
    maxJobs: number;
    maxCandidates: number;
    screeningCredits: number;
    interviewMinutes: number;
    seats: number;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoEmoji: string;
  industry: string;
  /** Marcas comerciales bajo las que la empresa publica vacantes (ej. Americana, Abiq, Friotec). */
  brands: string[];
  planId: string;
  status: 'active' | 'trial' | 'suspended';
  createdAt: string;
}

export type UserRole = 'owner' | 'recruiter' | 'admin' | 'super_admin';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  /** Cargo dentro de RR.HH. (ej. "Jefe de RR.HH."). */
  title?: string;
}

export type UsageType = 'screening' | 'interview_min' | 'whatsapp_msg' | 'llm_tokens';

export interface UsageEvent {
  id: string;
  tenantId: string;
  type: UsageType;
  amount: number;
  costUsd: number;
  refId?: string;
  createdAt: string;
}

// ---------- Reclutamiento ----------
export type JobStatus = 'draft' | 'open' | 'paused' | 'closed';

export interface InterviewQuestion {
  id: string;
  text: string;
  source: 'manual' | 'ai';
  weight: number;
  idealAnswer?: string;
}

export interface ScreeningFilter {
  id: string;
  polarity: 'positive' | 'negative';
  criterion: string;
  weight: number;
}

export interface Job {
  id: string;
  tenantId: string;
  title: string;
  /** Marca comercial para la que se contrata (una de `Tenant.brands`). */
  brand: string;
  department: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  status: JobStatus;
  salaryMin: number;
  salaryMax: number;
  description: string;
  applySlug: string;
  openings: number;
  createdAt: string;
  questions: InterviewQuestion[];
  filters: ScreeningFilter[];
}

export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected';

export type ScreeningStatus = 'pending' | 'scored' | 'error';

export interface CandidateExperience {
  company: string;
  role: string;
  years: number;
}

export interface ParsedCv {
  skills: string[];
  experience: CandidateExperience[];
  totalYears: number;
  education: string;
}

/** Evidencia anclada al texto del CV (anti-alucinación). */
export interface EvidenceMatch {
  criterion: string;
  matched: boolean;
  quote: string;
}

/** Fechas en que RR.HH. movió al candidato de etapa (alimentan las métricas de tiempos). */
export interface CandidateTimeline {
  /** RR.HH. revisó el CV (con el resultado de la IA) y lo pasó a screening. */
  screened?: string;
  /** Se le envió la respuesta para agendar entrevista. */
  replied?: string;
  /** Entrevista realizada. */
  interviewed?: string;
  /** Oferta enviada. */
  offered?: string;
  /** Descartado. */
  rejected?: string;
}

export interface Candidate {
  id: string;
  tenantId: string;
  jobId: string;
  /** Usuario de RR.HH. responsable del candidato. */
  ownerId?: string;
  timeline?: CandidateTimeline;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  stage: CandidateStage;
  appliedAt: string;
  hiredAt?: string; // fecha de contratación (alimenta time-to-fill)
  cvFileName: string;
  screeningStatus: ScreeningStatus;
  screeningScore?: number; // 0-100
  matchPercent?: number; // match semántico 0-100
  justification?: string;
  evidence?: EvidenceMatch[];
  flags?: string[];
  errorReason?: string; // cuando screeningStatus === 'error'
  parsed?: ParsedCv;
}

// ---------- Entrevistas IA ----------
export type InterviewChannel = 'phone' | 'whatsapp' | 'meet';
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'no_show';

export interface InterviewTurn {
  role: 'agent' | 'candidate';
  content: string;
}

export interface Discrepancy {
  topic: string;
  cvClaim: string;
  interviewClaim: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  channel: InterviewChannel;
  status: InterviewStatus;
  scheduledAt: string;
  score?: number;
  transcript?: InterviewTurn[];
  discrepancies?: Discrepancy[];
}

// ---------- Módulo Talento (la joya: 9-Box + Cultura 360°) ----------
export interface NineBoxDataPoint {
  id: string;
  name: string;
  initials: string;
  photoUrl?: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  enps: number; // 0-100
  performanceScore: number; // 1-5 (Desempeño / Ventas)
  cultureScore: number; // 1-5 (Cultura / Potencial)
  refinedPerformanceScore?: number;
  refinedCultureScore?: number;
  quadrant: string;
  /** Las 10 dimensiones 360° de esta persona, por `CultureDimension.key` (escala 1-5). */
  cultureScores: Record<string, number>;
  /** Historial de evaluaciones por trimestre (más antiguo → actual). */
  history: EvaluationPeriod[];
}

/** Una evaluación de un periodo (trimestre) — alimenta el historial y las decisiones de RR.HH. */
export interface EvaluationPeriod {
  period: string; // ej. "2026 T1"
  performanceScore: number; // 1-5
  cultureScore: number; // 1-5
}

export type CultureGroup = 'Liderazgo' | 'Comunicación y Soporte' | 'Inteligencia Emocional';

export interface CultureDimension {
  key: string;
  label: string;
  group: CultureGroup;
  score: number; // 1-5
}

// ---------- Respuestas automáticas a CVs (agendar entrevista) ----------
export type OutreachChannel = 'whatsapp' | 'email';
export type OutreachStatus = 'queued' | 'delivered' | 'confirmed' | 'no_reply';

export interface OutreachMessage {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  channel: OutreachChannel;
  to: string;
  body: string;
  status: OutreachStatus;
  sentAt: string;
  /** Fecha y hora propuesta al candidato en el mensaje. */
  slot?: string;
  /** Horario que el candidato confirmó (cuando status === 'confirmed'). */
  confirmedSlot?: string;
}
