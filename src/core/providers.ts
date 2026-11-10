// ============================================================
//  Registro central de proveedores.
//  La app importa SIEMPRE desde aquí, nunca un adaptador concreto.
//
//  DEMO_MODE === true  -> adaptadores mock (sin costo, sin claves) para
//  entrevistas, ayuda, mensajería, voz y cobros.
//  La lectura de CVs (cvScreening) ya es REAL desde la Entrega B: Storage de
//  Supabase + Edge Function `screen-cv` + Claude (la clave vive en Supabase).
//  Para el resto: crear los adaptadores reales en core/adapters/ y
//  registrarlos abajo. La UI no se entera: solo cambia este archivo.
// ============================================================
import type { CvParserPort, CvScreeningPort, LlmPort, MessagingPort, VoicePort, BillingPort } from './ports';
import { mockCvParser, mockLlm, mockMessaging, mockVoice, mockBilling } from './adapters/mock';
import { supabaseScreening } from './adapters/supabaseScreening';
import { DEMO_MODE } from './config';

export interface Providers {
  /** Lectura real de CVs (Storage + screen-cv + Claude). */
  cvScreening: CvScreeningPort;
  /** Parser simulado: solo lo usa el botón "CVs de ejemplo". */
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
    'DEMO_MODE=false pero faltan adaptadores reales (la lectura de CVs ya es real; faltan entrevistas, ayuda, ' +
      'mensajería, voz y cobros). Créalos en core/adapters/ y regístralos en core/providers.ts.',
  );
}

export const providers: Providers = {
  cvScreening: supabaseScreening,
  cvParser: mockCvParser,
  llm: mockLlm,
  messaging: mockMessaging,
  voice: mockVoice,
  billing: mockBilling,
};
