import { describe, expect, it } from 'vitest';
import { buildFunnel } from './funnel';

describe('buildFunnel (embudo acumulado con % de conversión entre etapas)', () => {
  const counts = { applied: 10, screening: 5, interview: 3, offer: 1, hired: 1, rejected: 4 };

  it('cada etapa cuenta a quienes llegaron a ella o más allá; los descartados solo aplicaron', () => {
    const { stages } = buildFunnel(counts);
    expect(stages.map((s) => [s.key, s.reached])).toEqual([
      ['applied', 24],
      ['screening', 10],
      ['interview', 5],
      ['offer', 2],
      ['hired', 1],
    ]);
  });

  it('el % es respecto a la etapa anterior y la primera no tiene', () => {
    const { stages } = buildFunnel(counts);
    expect(stages.map((s) => s.pct)).toEqual([null, 42, 50, 40, 50]);
  });

  it('señala la mayor caída entre dos etapas', () => {
    expect(buildFunnel(counts).biggestDrop).toEqual({ from: 'Entrevista', to: 'Oferta', lossPct: 60 });
  });

  it('sin candidatos no hay porcentajes ni caída', () => {
    const empty = buildFunnel({ applied: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 });
    expect(empty.stages.every((s) => s.reached === 0 && s.pct === null)).toBe(true);
    expect(empty.biggestDrop).toBeNull();
  });

  it('cuando nadie se pierde no hay caída que señalar', () => {
    const { biggestDrop } = buildFunnel({ applied: 0, screening: 0, interview: 0, offer: 0, hired: 3, rejected: 0 });
    expect(biggestDrop).toBeNull();
  });
});
