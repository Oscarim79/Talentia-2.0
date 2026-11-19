import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmProvider } from '../../components/ui/ConfirmDialog';
import type { Candidate } from '../../types';

// Dos candidatos de la misma empresa: uno en Oferta (el caso de Reynaldo) y otro en Screening.
const { list } = vi.hoisted(() => {
  const base = { source: 'Computrabajo', screeningStatus: 'scored', screeningScore: 80, appliedAt: '2026-11-18', tenantId: 't_americana', jobId: 'job_1' };
  return {
    list: [
      { ...base, id: 'c_jc', firstName: 'Juan Carlos', lastName: 'Marroquín', stage: 'offer' },
      { ...base, id: 'c_pm', firstName: 'Paola', lastName: 'Marroquín', stage: 'screening' },
    ] as unknown as Candidate[],
  };
});
vi.mock('../../context/CandidatesContext', () => ({ useCandidates: () => ({ candidates: list, setStage: () => {} }) }));
vi.mock('../../context/EvaluationsContext', () => ({ useEvaluations: () => ({ evaluations: {} }) }));

import CandidatesPage from './CandidatesPage';

describe('CandidatesPage: tarjeta en Oferta', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <ConfirmProvider>
        <CandidatesPage />
      </ConfirmProvider>
    </MemoryRouter>,
  );

  it('solo la tarjeta en Oferta tiene los botones para cerrar la oferta', () => {
    expect(html.match(/Marcar como contratado/g)?.length).toBe(1);
    expect(html.match(/No aceptó la oferta/g)?.length).toBe(1);
  });

  it('las dos personas siguen apareciendo en su columna', () => {
    expect(html).toContain('Juan Carlos Marroquín');
    expect(html).toContain('Paola Marroquín');
  });
});
