import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('es un diálogo accesible con título, mensaje y los dos botones', () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        title="Restablecer la demo de la empresa"
        message="Se borrarán los datos de la empresa."
        confirmLabel="Sí, restablecer"
        tone="danger"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Restablecer la demo de la empresa');
    expect(html).toContain('Se borrarán los datos de la empresa.');
    expect(html).toContain('Sí, restablecer');
    expect(html).toContain('Cancelar');
    expect(html).toContain('bg-red-600');
  });

  it('sin tono de peligro usa el botón principal normal y las etiquetas por defecto', () => {
    const html = renderToStaticMarkup(<ConfirmDialog title="¿Continuar?" message="Sin vuelta atrás." onConfirm={() => {}} onCancel={() => {}} />);
    expect(html).toContain('Confirmar');
    expect(html).toContain('bg-brand-600');
    expect(html).not.toContain('bg-red-600');
  });
});
