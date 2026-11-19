import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NineBoxMatrix } from './NineBoxMatrix';
import type { NineBoxDataPoint } from '../types';

const person = (over: Partial<NineBoxDataPoint>): NineBoxDataPoint => ({
  ...({} as NineBoxDataPoint),
  id: 'p1',
  name: 'Ana López',
  initials: 'AL',
  performanceScore: 5,
  cultureScore: 5,
  ...over,
});

describe('NineBoxMatrix (legible sin depender del color)', () => {
  const html = renderToStaticMarkup(
    <NineBoxMatrix
      dataPoints={[person({}), person({ id: 'p2', name: 'Luis Pérez', initials: 'LP', performanceScore: 1, cultureScore: 1 })]}
    />,
  );

  it('cada celda dice cuántas personas tiene', () => {
    expect(html).toContain('aria-label="Superestrella: 1 persona"');
    expect(html).toContain('aria-label="Crítico o Inadecuado: 1 persona"');
    expect(html).toContain('aria-label="Estrella: 0 personas"');
  });

  it('cada persona es un botón con nombre y puntajes (también con teclado)', () => {
    expect(html).toContain('<button');
    expect(html).toContain('aria-label="Ana López: desempeño 5.0, cultura 5.0"');
  });

  it('tiene una leyenda que explica los colores con palabras', () => {
    expect(html).toContain('Leyenda');
    expect(html).toContain('Potencial alto');
    expect(html).toContain('Requiere atención');
  });
});
