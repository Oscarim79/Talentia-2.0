import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const MIN_PX = 12;

function tsxFiles(): string[] {
  return readdirSync(SRC, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.tsx') && !d.name.includes('.test.'))
    .map((d) => join(d.parentPath, d.name));
}

describe('tamaño mínimo de texto', () => {
  it(`ningún componente usa texto menor de ${MIN_PX}px (las etiquetitas usan la clase eyebrow)`, () => {
    const offenders = tsxFiles().flatMap((f) => {
      const small = [...readFileSync(f, 'utf8').matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)]
        .map((m) => m[1])
        .filter((px) => Number(px) < MIN_PX);
      return small.length ? [`${relative(SRC, f)}: ${small.map((px) => `${px}px`).join(' ')}`] : [];
    });
    expect(offenders).toEqual([]);
  });

  it('index.css define la clase eyebrow con al menos 11px', () => {
    const css = readFileSync(join(SRC, 'index.css'), 'utf8');
    const size = css.match(/@utility eyebrow\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/)?.[1];
    expect(Number(size)).toBeGreaterThanOrEqual(11);
  });
});
