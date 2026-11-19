import { describe, expect, it } from 'vitest';
import { getTabTarget } from './dialogFocus';

// Elementos "de mentira": al foco solo le importa la identidad y el orden.
const el = (name: string) => ({ name }) as unknown as HTMLElement;
const a = el('a');
const b = el('b');
const c = el('c');

describe('getTabTarget (el foco no se escapa del diálogo)', () => {
  it('sin elementos enfocables no hay a dónde ir', () => {
    expect(getTabTarget([], null, false)).toBeNull();
  });

  it('Tab en el último elemento vuelve al primero', () => {
    expect(getTabTarget([a, b, c], c, false)).toBe(a);
  });

  it('Shift+Tab en el primer elemento va al último', () => {
    expect(getTabTarget([a, b, c], a, true)).toBe(c);
  });

  it('en medio deja que el navegador avance solo', () => {
    expect(getTabTarget([a, b, c], b, false)).toBeNull();
    expect(getTabTarget([a, b, c], b, true)).toBeNull();
  });

  it('si el foco está fuera del diálogo, entra por el primero', () => {
    expect(getTabTarget([a, b, c], null, false)).toBe(a);
    expect(getTabTarget([a, b, c], el('fuera'), true)).toBe(a);
  });
});
