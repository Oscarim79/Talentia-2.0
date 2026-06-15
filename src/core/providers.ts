// ============================================================
//  Registro central de proveedores.
//  La app importa SIEMPRE desde aquí, nunca un adaptador concreto.
//
//  DEMO_MODE === true  -> adaptadores mock (sin costo, sin claves).
//  Para producción: crear los adaptadores reales y cambiarlos aquí.
//  La UI no se entera: solo cambia esta línea.
// ============================================================
import type { CvParserPort, LlmPort, MessagingPort, VoicePort, BillingPort } from './ports';
import { mockCvParser, mockLlm, mockMessaging, mockVoice, mockBilling } from './adapters/mock';

export interface Providers {
  cvParser: CvParserPort;
  llm: LlmPort;
  messaging: MessagingPort;
  voice: VoicePort;
  billing: BillingPort;
}

export const providers: Providers = {
  cvParser: mockCvParser,
  llm: mockLlm,
  messaging: mockMessaging,
  voice: mockVoice,
  billing: mockBilling,
};
