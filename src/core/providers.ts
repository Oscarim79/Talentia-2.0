// ============================================================
//  Registro central de proveedores.
//  La app importa SIEMPRE desde aquí, nunca un adaptador concreto.
//
//  DEMO_MODE === true  -> adaptadores mock (sin costo, sin claves).
//  Para producción: crear los adaptadores reales en core/adapters/
//  y registrarlos abajo. La UI no se entera: solo cambia este archivo.
// ============================================================
import type { CvParserPort, LlmPort, MessagingPort, VoicePort, BillingPort } from './ports';
import { mockCvParser, mockLlm, mockMessaging, mockVoice, mockBilling } from './adapters/mock';
import { DEMO_MODE } from './config';

export interface Providers {
  cvParser: CvParserPort;
  llm: LlmPort;
  messaging: MessagingPort;
  voice: VoicePort;
  billing: BillingPort;
}

if (!DEMO_MODE) {
  // Falla en el arranque, no a mitad de la demo: apagar DEMO_MODE sin
  // adaptadores reales registrados sería mentirle a la UI.
  throw new Error(
    'DEMO_MODE=false pero no hay adaptadores reales registrados. ' +
      'Crea los adaptadores (LlamaParse, Claude, Twilio, Vapi, Stripe) en core/adapters/ y regístralos en core/providers.ts.',
  );
}

export const providers: Providers = {
  cvParser: mockCvParser,
  llm: mockLlm,
  messaging: mockMessaging,
  voice: mockVoice,
  billing: mockBilling,
};
