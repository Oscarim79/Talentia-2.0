import { describe, expect, it } from 'vitest';
import { cvPathFor, isDocx, mimeFor, safeFileName, validateFile } from './supabaseScreening';

describe('supabaseScreening (funciones puras)', () => {
  it('validateFile', () => {
    expect(validateFile({ name: 'CV.PDF', size: 1000 })).toBeNull();
    expect(validateFile({ name: 'foto.JPG', size: 1000 })).toBeNull();
    expect(validateFile({ name: 'foto.png', size: 1000 })).toBeNull();
    expect(validateFile({ name: 'cv.docx', size: 1000 })).toBeNull();
    expect(validateFile({ name: 'cv.doc', size: 1000 })).toBe('unsupported_format');
    expect(validateFile({ name: 'cv.txt', size: 1000 })).toBe('unsupported_format');
    expect(validateFile({ name: 'cv', size: 1000 })).toBe('unsupported_format');
    expect(validateFile({ name: 'cv.pdf', size: 10 * 1024 * 1024 })).toBeNull();
    expect(validateFile({ name: 'cv.pdf', size: 10 * 1024 * 1024 + 1 })).toBe('too_large');
  });
  it('imágenes hasta 7 MB (el API cuenta el base64, que infla un tercio)', () => {
    expect(validateFile({ name: 'foto.jpg', size: 7 * 1024 * 1024 })).toBeNull();
    expect(validateFile({ name: 'foto.jpg', size: 7 * 1024 * 1024 + 1 })).toBe('too_large');
    expect(validateFile({ name: 'foto.PNG', size: 8 * 1024 * 1024 })).toBe('too_large');
    expect(validateFile({ name: 'cv.pdf', size: 8 * 1024 * 1024 })).toBeNull();
  });
  it('safeFileName y cvPathFor', () => {
    expect(safeFileName('Currículum José (final).PDF')).toBe('curriculum-jose-final.pdf');
    expect(safeFileName('')).toBe('cv');
    expect(safeFileName('a'.repeat(100) + '.pdf').length).toBeLessThanOrEqual(80);
    expect(safeFileName('a'.repeat(100) + '.pdf').endsWith('.pdf')).toBe(true);
    expect(cvPathFor('t_1', 'cand_9', 'Hoja de Vida.docx')).toBe('t_1/cand_9/hoja-de-vida.docx');
  });
  it('mimeFor e isDocx', () => {
    expect(mimeFor('a.PDF')).toBe('application/pdf');
    expect(mimeFor('a.jpg')).toBe('image/jpeg');
    expect(mimeFor('a.jpeg')).toBe('image/jpeg');
    expect(mimeFor('a.png')).toBe('image/png');
    expect(mimeFor('a.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(isDocx('a.DOCX')).toBe(true);
    expect(isDocx('a.pdf')).toBe(false);
  });
});
