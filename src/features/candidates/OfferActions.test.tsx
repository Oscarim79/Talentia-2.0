import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfirmProvider } from '../../components/ui/ConfirmDialog';
import { CANDIDATES } from '../../data/seed';
import { OfferActions, offerDecision } from './OfferActions';
import type { Candidate } from '../../types';

const juan: Candidate = { ...CANDIDATES[0], id: 'c_jc', firstName: 'Juan Carlos', lastName: 'Marroquín', stage: 'offer' };

function render(c: Candidate) {
  return renderToStaticMarkup(
    <ConfirmProvider>
      <OfferActions candidate={c} onStage={() => {}} />
    </ConfirmProvider>,
  );
}

describe('offerDecision (textos de la confirmación)', () => {
  it('aceptó: pasa a Contratado, pregunta con el nombre y avisa que la fecha de hoy alimenta Métricas', () => {
    const d = offerDecision('hired', 'Juan Carlos Marroquín');
    expect(d.stage).toBe('hired');
    expect(d.confirm.title).toContain('Juan Carlos Marroquín');
    expect(d.confirm.title).toContain('contratado');
    expect(d.confirm.message).toContain('fecha de hoy');
    expect(d.confirm.confirmLabel).toBe('Sí, contratado');
    expect(d.confirm.tone).toBeUndefined();
    expect(d.notice).toBe('Juan Carlos Marroquín pasó a Contratados.');
  });

  it('no aceptó: pasa a Descartado con tono de peligro', () => {
    const d = offerDecision('declined', 'Juan Carlos Marroquín');
    expect(d.stage).toBe('rejected');
    expect(d.confirm.title).toContain('no aceptó la oferta');
    expect(d.confirm.tone).toBe('danger');
    expect(d.confirm.confirmLabel).toBe('Sí, no aceptó');
    expect(d.notice).toBe('Juan Carlos Marroquín pasó a Descartados.');
  });
});

describe('OfferActions', () => {
  it('con el candidato en Oferta muestra "Marcar como contratado" y "No aceptó la oferta"', () => {
    const html = render(juan);
    expect(html).toContain('Marcar como contratado');
    expect(html).toContain('No aceptó la oferta');
    expect(html.match(/<button/g)?.length).toBe(2);
  });

  it('en cualquier otra etapa no pinta nada', () => {
    for (const stage of ['applied', 'screening', 'interview', 'hired', 'rejected'] as const) {
      expect(render({ ...juan, stage })).toBe('');
    }
  });
});
