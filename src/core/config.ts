export const APP = {
  name: 'TALENTIA',
  version: '2.0',
  tagline: 'Reclutamiento masivo con IA — del candidato al 9-Box',
};

/**
 * DEMO_MODE: los proveedores de pago que aún no están conectados (entrevistas
 * por IA, chat de ayuda, WhatsApp, voz, Stripe) usan implementaciones MOCK.
 *
 * Desde la Entrega B (2026-11) la LECTURA DE CVs ES REAL: el archivo se guarda
 * en Storage de Supabase y la Edge Function `screen-cv` lo puntúa con Claude
 * (la clave vive como secreto en Supabase, nunca aquí). El botón "CVs de
 * ejemplo" sigue simulado y gratis.
 *
 * Para el resto: poner en false y crear los adaptadores reales en
 * core/adapters/. La UI no cambia — solo se intercambian en core/providers.ts.
 */
export const DEMO_MODE = true;

/** Nombre del modelo que lee los CVs, para los textos de la app (el modelo real se fija en supabase/functions/screen-cv/logic.ts). */
export const AI_SCREENING_LABEL = 'Claude Sonnet 5.5';

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
