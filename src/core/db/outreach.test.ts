import { describe, expect, it } from 'vitest';
import type { OutreachMessage } from '../../types';
import { messageToRow, rowToMessage } from './outreach';

const base: OutreachMessage = {
  id: 'msg_1',
  tenantId: 'americana',
  candidateId: 'cand_1',
  candidateName: 'Ana Pérez',
  jobId: 'job_1',
  channel: 'whatsapp',
  to: '+50499999999',
  body: 'Hola Ana',
  status: 'queued',
  sentAt: '2026-11-09T10:00:00.000Z',
};

describe('outreach mapper', () => {
  it('ida y vuelta con horario propuesto y confirmado', () => {
    const m: OutreachMessage = { ...base, status: 'confirmed', slot: 'lun 10:00', confirmedSlot: 'lun 10:00' };
    expect(rowToMessage(messageToRow(m))).toEqual(m);
  });
  it('ida y vuelta sin horarios: vuelven ausentes, no null', () => {
    const back = rowToMessage(messageToRow(base));
    expect(back.slot).toBeUndefined();
    expect(back.confirmedSlot).toBeUndefined();
    expect(back).toEqual(base);
  });
});
