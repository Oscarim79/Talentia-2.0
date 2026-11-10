import { describe, expect, it } from 'vitest';
import {
  API_MAX_RETRIES,
  API_TIMEOUT_MS,
  MAX_TOKENS,
  OUTPUT_SCHEMA,
  buildUserText,
  criteriaFromFilters,
  estimateCostUsd,
  interpretResponse,
  isOverDailyLimit,
  kindFromPath,
  mapApiError,
  normalizeOutput,
  textPathFor,
} from './logic';

const MUST = ['Ventas en piso', 'Manejo de caja'];
const good = {
  readable: true,
  unreadableReason: '',
  person: { firstName: 'Ana', lastName: 'López', email: 'ana@mail.com', phone: '5555-1234' },
  parsed: {
    skills: ['ventas'],
    experience: [{ company: 'Max', role: 'Vendedora', years: 2 }],
    totalYears: 2,
    education: 'Diversificado',
  },
  score: {
    score: 101.6,
    matchPercent: -3,
    justification: 'ok',
    evidence: [
      { criterion: 'Manejo de caja', matched: true, quote: 'caja' },
      { criterion: 'Inventado', matched: true, quote: 'x' },
    ],
    flags: [],
  },
};

describe('normalizeOutput', () => {
  it('recorta y redondea puntajes', () => {
    const r = normalizeOutput(good, MUST);
    if (!r.ok) throw new Error('esperaba ok');
    expect(r.score.score).toBe(100);
    expect(r.score.matchPercent).toBe(0);
  });
  it('una evidencia por imprescindible, en orden, sin inventadas', () => {
    const r = normalizeOutput(good, MUST);
    if (!r.ok) throw new Error('esperaba ok');
    expect(r.score.evidence.map((e) => e.criterion)).toEqual(MUST);
    expect(r.score.evidence[0]).toEqual({
      criterion: 'Ventas en piso',
      matched: false,
      quote: '— sin evidencia en el CV —',
    });
    expect(r.score.evidence[1]).toEqual({ criterion: 'Manejo de caja', matched: true, quote: 'caja' });
  });
  it('conserva persona y datos del CV', () => {
    const r = normalizeOutput(good, MUST);
    if (!r.ok) throw new Error('esperaba ok');
    expect(r.person).toEqual(good.person);
    expect(r.parsed).toEqual(good.parsed);
  });
  it('ilegible y no-CV son errores', () => {
    expect(normalizeOutput({ ...good, readable: false, unreadableReason: 'illegible' }, MUST)).toEqual({
      ok: false,
      errorReason: 'illegible_pdf',
    });
    expect(normalizeOutput({ ...good, readable: false, unreadableReason: 'not_a_cv' }, MUST)).toEqual({
      ok: false,
      errorReason: 'not_a_cv',
    });
    expect(normalizeOutput({ ...good, readable: false, unreadableReason: 'other' }, MUST)).toEqual({
      ok: false,
      errorReason: 'illegible_pdf',
    });
  });
  it('basura → ai_error', () => {
    expect(normalizeOutput(null, MUST)).toEqual({ ok: false, errorReason: 'ai_error' });
    expect(normalizeOutput({ readable: true }, MUST)).toEqual({ ok: false, errorReason: 'ai_error' });
  });
});

describe('interpretResponse', () => {
  it('refusal → ai_refused; max_tokens → ai_error; JSON inválido → ai_error', () => {
    expect(interpretResponse({ stop_reason: 'refusal', content: [] }, MUST)).toEqual({ ok: false, errorReason: 'ai_refused' });
    expect(interpretResponse({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{' }] }, MUST)).toEqual({
      ok: false,
      errorReason: 'ai_error',
    });
    expect(interpretResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'no json' }] }, MUST)).toEqual({
      ok: false,
      errorReason: 'ai_error',
    });
  });
  it('end_turn con JSON válido → ok', () => {
    const r = interpretResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(good) }] }, MUST);
    expect(r.ok).toBe(true);
  });
});

describe('mapApiError', () => {
  it.each([
    [401, 'ai_not_configured'],
    [403, 'ai_not_configured'],
    [413, 'too_large'],
    [429, 'ai_error'],
    [500, 'ai_error'],
    [529, 'ai_error'],
  ])('%s → %s', (status, code) => {
    expect(mapApiError({ status })).toBe(code);
  });
  it('400 por PDF cifrado / dañado / otro', () => {
    expect(mapApiError({ status: 400, message: 'PDF is password protected' })).toBe('password_protected');
    expect(mapApiError({ status: 400, message: 'Could not process PDF' })).toBe('corrupt');
    expect(mapApiError({ status: 400, message: 'invalid request' })).toBe('ai_error');
  });
  it('400 por tamaño → too_large (antes que corrupt)', () => {
    expect(mapApiError({ status: 400, message: 'image exceeds 10 MB maximum' })).toBe('too_large');
    expect(mapApiError({ status: 400, message: 'Request too large for pdf document' })).toBe('too_large');
  });
  it('sin status (red / timeout) → ai_error', () => {
    expect(mapApiError({ name: 'APIConnectionTimeoutError' })).toBe('ai_error');
  });
});

describe('límites de la función (plan gratis: 150 s de pared)', () => {
  it('max_tokens deja sitio al pensamiento adaptativo', () => {
    expect(MAX_TOKENS).toBeGreaterThanOrEqual(8000);
  });
  it('tiempo total con reintentos < 150 s', () => {
    expect(API_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000);
    expect(API_TIMEOUT_MS * (API_MAX_RETRIES + 1)).toBeLessThanOrEqual(130_000);
  });
});

describe('utilidades', () => {
  it('tope diario: 299 pasa, 300 no', () => {
    expect(isOverDailyLimit(299)).toBe(false);
    expect(isOverDailyLimit(300)).toBe(true);
  });
  it('kindFromPath', () => {
    expect(kindFromPath('t/c/cv.PDF')).toEqual({ kind: 'pdf', mediaType: 'application/pdf' });
    expect(kindFromPath('t/c/foto.jpeg')).toEqual({ kind: 'image', mediaType: 'image/jpeg' });
    expect(kindFromPath('t/c/foto.jpg')).toEqual({ kind: 'image', mediaType: 'image/jpeg' });
    expect(kindFromPath('t/c/foto.png')).toEqual({ kind: 'image', mediaType: 'image/png' });
    expect(kindFromPath('t/c/cv.docx')).toEqual({ kind: 'text', mediaType: 'text/plain' });
    expect(kindFromPath('t/c/cv.doc')).toBeNull();
  });
  it('textPathFor', () => {
    expect(textPathFor('t1/c1/cv.docx')).toBe('t1/c1/texto.txt');
  });
  it('costo: 10k entrada + 1k salida + 2k caché leída = 0.0302', () => {
    expect(estimateCostUsd({ input_tokens: 10000, output_tokens: 1000, cache_read_input_tokens: 2000 })).toBe(0.0302);
  });
  it('costo: sin tokens = 0', () => {
    expect(estimateCostUsd({ input_tokens: 0, output_tokens: 0 })).toBe(0);
  });
  it('criteriaFromFilters separa por polaridad y tolera null', () => {
    expect(
      criteriaFromFilters('Asesor', [
        { criterion: 'A', polarity: 'positive' },
        { criterion: 'B', polarity: 'negative' },
      ]),
    ).toEqual({ title: 'Asesor', mustHaves: ['A'], negatives: ['B'] });
    expect(criteriaFromFilters('X', null)).toEqual({ title: 'X', mustHaves: [], negatives: [] });
  });
  it('buildUserText menciona título, criterios y Word cuando es texto', () => {
    const t = buildUserText({ title: 'Asesor', mustHaves: ['A'], negatives: ['B'] }, 'text');
    expect(t).toContain('Asesor');
    expect(t).toContain('A');
    expect(t).toContain('B');
    expect(t).toMatch(/Word/);
    expect(buildUserText({ title: 'Asesor', mustHaves: [], negatives: [] }, 'pdf')).not.toMatch(/Word/);
  });
  it('el esquema no admite propiedades extra', () => {
    expect(OUTPUT_SCHEMA).toMatchObject({ type: 'object', additionalProperties: false });
  });
});
