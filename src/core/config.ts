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
 * Persistencia con Supabase (auth + datos reales).
 *
 * La *publishable key* es PÚBLICA por diseño (pensada para vivir en el cliente),
 * por eso puede ir como default acá. Se puede sobreescribir con variables de
 * entorno (.env.local) sin tocar código:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
 *
 * NUNCA poner aquí la secret key (sb_secret_…) ni la contraseña de la base.
 */
export const SUPABASE = {
  url: import.meta.env.VITE_SUPABASE_URL ?? 'https://zdvcvazybuupalvjacnh.supabase.co',
  publishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    'sb_publishable_mJSNIMsZ-fKDhs7lTcnv-w_1urMj8Uj',
};

/** true cuando hay URL + key configuradas (no implica que el schema ya exista). */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE.url && SUPABASE.publishableKey);
