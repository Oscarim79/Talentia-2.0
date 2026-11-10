import { describe, expect, it } from 'vitest';
import { SCREENING_ERRORS, canRetry, screeningErrorLabel } from './screeningErrors';

describe('screeningErrors', () => {
  it('etiqueta y reintento', () => {
    expect(screeningErrorLabel('ai_not_configured')).toBe('La IA aún no está configurada; avísale a Oscar');
    expect(canRetry('ai_not_configured')).toBe(true);
    expect(canRetry('illegible_pdf')).toBe(false);
    expect(canRetry('ai_error')).toBe(true);
    expect(canRetry('daily_limit')).toBe(true);
  });
  it('códigos desconocidos', () => {
    expect(screeningErrorLabel('zzz')).toBe('Error de lectura');
    expect(screeningErrorLabel(undefined)).toBe('Error de lectura');
    expect(canRetry(undefined)).toBe(false);
  });
  it('catálogo completo', () => {
    expect(Object.keys(SCREENING_ERRORS)).toHaveLength(12);
    expect(SCREENING_ERRORS.unsupported_format.label).toBe('Formato no admitido: PDF, JPG, PNG o Word (.docx)');
    expect(SCREENING_ERRORS.too_large.label).toBe('El archivo es demasiado grande (PDF hasta 10 MB, imágenes hasta 7 MB)');
  });
});
