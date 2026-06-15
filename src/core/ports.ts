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

export interface LlmPort {
  generateJobDescription(input: {
    title: string;
    department: string;
    seniority: string;
  }): Promise<string>;
  generateInterviewQuestions(input: { title: string; count: number }): Promise<string[]>;
  scoreCandidate(input: ScoreInput): Promise<ScoreResult>;
  interviewReply(input: { history: InterviewTurn[]; context: string }): Promise<string>;
}

// ---- Mensajería WhatsApp (Twilio / Meta en producción) ----
export interface MessagingPort {
  sendWhatsApp(input: { to: string; body: string }): Promise<{ id: string; status: string }>;
}

// ---- Voz / telefonía (Vapi / Retell en producción) ----
export interface VoicePort {
  startCall(input: { to: string; agentScript: string }): Promise<{ sessionId: string; status: string }>;
}

// ---- Billing (Stripe en producción) ----
export interface BillingPort {
  checkout(input: { tenantId: string; planId: string }): Promise<{ url: string }>;
}
