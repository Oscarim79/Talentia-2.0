import { describe, expect, it } from 'vitest';
import { nameInitials } from './utils';

describe('nameInitials (monograma en lugar de emoji)', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(nameInitials('Americana 2000')).toBe('A2');
    expect(nameInitials('Contacta BPO')).toBe('CB');
  });

  it('con una sola palabra usa sus dos primeras letras', () => {
    expect(nameInitials('NovaPay')).toBe('NO');
  });

  it('ignora espacios de más y siempre devuelve mayúsculas', () => {
    expect(nameInitials('  friotec   guatemala ')).toBe('FG');
  });

  it('sin nombre devuelve un marcador', () => {
    expect(nameInitials('')).toBe('?');
  });
});
