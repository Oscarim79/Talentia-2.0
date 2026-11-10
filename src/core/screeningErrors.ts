// ============================================================
//  Catálogo de errores de la lectura de CVs (Screening IA).
//  Los códigos son los mismos que devuelve la Edge Function `screen-cv`
//  (supabase/functions/screen-cv/logic.ts). Aquí vive la etiqueta que ve
//  RR.HH. y si el error admite "Reintentar" sin volver a subir el archivo.
// ============================================================

export const SCREENING_ERRORS = {
  unsupported_format: { label: 'Formato no admitido: PDF, JPG, PNG o Word (.docx)', retry: false },
  too_large: { label: 'El archivo pasa de 10 MB', retry: false },
  upload_failed: { label: 'No se pudo guardar el archivo; revisa tu conexión y vuelve a subirlo', retry: false },
  illegible_pdf: { label: 'Ilegible (escaneo borroso o foto)', retry: false },
  not_a_cv: { label: 'El documento no parece un CV', retry: false },
  password_protected: { label: 'PDF protegido con contraseña', retry: false },
  corrupt: { label: 'Archivo dañado', retry: false },
  ai_not_configured: { label: 'La IA aún no está configurada; avísale a Oscar', retry: true },
  ai_refused: { label: 'La IA no pudo procesar este documento', retry: false },
  ai_error: { label: 'La IA no respondió; inténtalo de nuevo en un momento', retry: true },
  daily_limit: { label: 'Se alcanzó el límite diario de lecturas de la empresa', retry: true },
  not_found: { label: 'El candidato ya no existe', retry: false },
} as const satisfies Record<string, { label: string; retry: boolean }>;

export type ScreeningErrorCode = keyof typeof SCREENING_ERRORS;

function entry(code: string | undefined): { label: string; retry: boolean } | undefined {
  return code && code in SCREENING_ERRORS ? SCREENING_ERRORS[code as ScreeningErrorCode] : undefined;
}

/** Etiqueta en español para RR.HH.; un código desconocido se muestra como error genérico. */
export function screeningErrorLabel(code: string | undefined): string {
  return entry(code)?.label ?? 'Error de lectura';
}

/** true si se puede volver a intentar la lectura con el archivo ya guardado. */
export function canRetry(code: string | undefined): boolean {
  return entry(code)?.retry ?? false;
}
