import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip } from './Tooltip';

describe('Tooltip (funciona con teclado, lector de pantalla y toque, no solo con el cursor)', () => {
  it('el texto queda en el DOM como tooltip y el disparador lo referencia', () => {
    const html = renderToStaticMarkup(
      <Tooltip text="Guía que aplica a esta vacante">
        <span>Guía: Vendedor</span>
      </Tooltip>,
    );
    const tooltipId = html.match(/role="tooltip"[^>]*id="([^"]+)"/)?.[1] ?? html.match(/id="([^"]+)"[^>]*role="tooltip"/)?.[1];
    expect(tooltipId).toBeTruthy();
    expect(html).toContain('Guía que aplica a esta vacante');
    expect(html).toContain(`aria-describedby="${tooltipId}"`);
  });

  it('el disparador se puede enfocar con el teclado', () => {
    const html = renderToStaticMarkup(
      <Tooltip text="Meta: 3 días">
        <span>●</span>
      </Tooltip>,
    );
    expect(html).toContain('tabindex="0"');
  });

  it('no usa el atributo title del navegador', () => {
    const html = renderToStaticMarkup(
      <Tooltip text="Explicación">
        <span>x</span>
      </Tooltip>,
    );
    expect(html).not.toMatch(/\stitle="/);
  });
});
