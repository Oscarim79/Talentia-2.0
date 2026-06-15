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

export interface Candidate {
  id: string;
  tenantId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  stage: CandidateStage;
  appliedAt: string;
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

// ---------- Métricas de contratación (costo + time-to-fill) ----------
export interface Hire {
  id: string;
  tenantId: string;
  jobId: string;
  candidateName: string;
  source: string;
  openedAt: string; // fecha de apertura de la vacante (ISO)
  filledAt: string; // fecha de contratación (ISO)
  /** Desglose del costo de esta contratación en USD. */
  costBreakdown: { ai: number; recruiter: number; advertising: number };
}

// ---------- Módulo Talento (la joya: 9-Box + Cultura 360°) ----------
export interface NineBoxDataPoint {
  id: string;
  name: string;
  initials: string;
  photoUrl?: string;
  performanceScore: number; // 1-5 (Desempeño / Ventas)
  cultureScore: number; // 1-5 (Cultura / Potencial)
  refinedPerformanceScore?: number;
  refinedCultureScore?: number;
  quadrant: string;
}

export type CultureGroup = 'Liderazgo' | 'Comunicación y Soporte' | 'Inteligencia Emocional';

export interface CultureDimension {
  key: string;
  label: string;
  group: CultureGroup;
  score: number; // 1-5
}
