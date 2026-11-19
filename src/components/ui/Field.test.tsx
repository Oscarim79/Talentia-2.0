import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Field } from './Field';

const attr = (html: string, name: string) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];

describe('Field (etiqueta, ayuda y error junto al campo)', () => {
  it('enlaza la etiqueta con el campo por id', () => {
    const html = renderToStaticMarkup(
      <Field label="Título del puesto">
        <input />
      </Field>,
    );
    const forId = attr(html, 'for');
    expect(forId).toBeTruthy();
    expect(attr(html, 'id')).toBe(forId);
    expect(html).toContain('Título del puesto');
  });

  it('con error: lo muestra debajo, marca el campo como inválido y lo enlaza con aria-describedby', () => {
    const html = renderToStaticMarkup(
      <Field label="Departamento" error="Escribe el departamento.">
        <input />
      </Field>,
    );
    expect(html).toContain('Escribe el departamento.');
    expect(html).toContain('aria-invalid="true"');
    const described = attr(html, 'aria-describedby');
    expect(described).toBeTruthy();
    expect(html).toContain(`id="${described}"`);
  });

  it('con ayuda: la muestra y también la enlaza con el campo', () => {
    const html = renderToStaticMarkup(
      <Field label="Meta" help="Entre 1 y 60 días.">
        <input />
      </Field>,
    );
    expect(html).toContain('Entre 1 y 60 días.');
    const described = attr(html, 'aria-describedby');
    expect(described).toBeTruthy();
    expect(html).toContain(`id="${described}"`);
    expect(html).not.toContain('aria-invalid="true"');
  });

  it('sin error ni ayuda no inventa atributos', () => {
    const html = renderToStaticMarkup(
      <Field label="Ubicación">
        <input />
      </Field>,
    );
    expect(html).not.toContain('aria-describedby');
    expect(html).not.toContain('aria-invalid');
  });
});
