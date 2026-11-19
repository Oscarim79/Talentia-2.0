import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { CHART } from './chartTheme';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(join(SRC, 'index.css'), 'utf8');

function tsxFiles(): string[] {
  return readdirSync(SRC, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.tsx') && !d.name.includes('.test.'))
    .map((d) => join(d.parentPath, d.name));
}

describe('colores de las gráficas desde la marca', () => {
  it('toda variable que usa chartTheme existe en index.css', () => {
    const refs = JSON.stringify(CHART).match(/var\((--[a-z0-9-]+)\)/g) ?? [];
    expect(refs.length).toBeGreaterThan(0);
    const missing = refs
      .map((r) => r.replace(/^var\(|\)$/g, ''))
      .filter((name) => !css.includes(`${name}:`));
    expect(missing).toEqual([]);
  });

  it('ningún componente escribe colores hex a mano (salvo el logo)', () => {
    const offenders = tsxFiles()
      .filter((f) => !f.replace(/\\/g, '/').endsWith('components/brand/Logo.tsx'))
      .flatMap((f) => {
        const hits = readFileSync(f, 'utf8').match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) ?? [];
        return hits.length ? [`${relative(SRC, f)}: ${hits.join(' ')}`] : [];
      });
    expect(offenders).toEqual([]);
  });
});
