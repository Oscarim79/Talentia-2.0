import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge, Button } from './primitives';

describe('Button con estado de carga', () => {
  it('mientras carga queda deshabilitado, avisa con aria-busy y muestra el giro', () => {
    const html = renderToStaticMarkup(<Button loading>Guardar</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<button[^>]*\sdisabled/);
    expect(html).toContain('animate-spin');
    expect(html).toContain('Guardar');
  });

  it('sin carga no marca aria-busy ni gira', () => {
    const html = renderToStaticMarkup(<Button>Guardar</Button>);
    expect(html).not.toContain('aria-busy');
    expect(html).not.toContain('animate-spin');
  });
});

describe('Badge con explicación', () => {
  it('la explicación es un tooltip accesible, no un title del navegador', () => {
    const html = renderToStaticMarkup(<Badge title="Se deduce del título de la vacante">Guía: Vendedor</Badge>);
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('Se deduce del título de la vacante');
    expect(html).not.toMatch(/\stitle="/);
  });
});
