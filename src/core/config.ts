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

/**
 * TEAM_PILOT: la app queda lista para que el equipo de RR.HH. la pruebe.
 * - El selector de empresa se oculta (siempre Americana 2000).
 * - La consola "Admin" del SaaS sale del menú (no es para RR.HH.).
 * - El guion de la ronda de prueba queda disponible en /ronda-de-prueba.
 * Poner en false para volver a la vista multi-empresa completa (demo al CEO / Oscar).
 */
export const TEAM_PILOT = true;

/** Correo al que el equipo envía sus preguntas y comentarios de la ronda de prueba. */
export const FEEDBACK_EMAIL = 'omorales@americana2000.com';
