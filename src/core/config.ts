export const APP = {
  name: 'TALENTIA',
  version: '2.0',
  tagline: 'Reclutamiento masivo con IA — del candidato al 9-Box',
};

/**
 * DEMO_MODE: todos los proveedores de pago (parser de CV, LLM, WhatsApp, voz,
 * Stripe) usan implementaciones MOCK. La app es 100% funcional como demostración
 * sin conectar ni pagar nada.
 *
 * Cuando el CEO apruebe la inversión: poner en false y crear los adaptadores
 * reales en core/adapters/ (LlamaParse, Claude, Twilio, Vapi, Stripe). La UI no
 * cambia — solo se intercambian los adaptadores en core/providers.ts.
 */
export const DEMO_MODE = true;
