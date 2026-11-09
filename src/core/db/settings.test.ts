import { describe, expect, it } from 'vitest';
import { defaultSettings, rowToSettings, settingsToRow } from './settings';

describe('settings mapper', () => {
  it('fila parcial: lo que falta cae a los valores de fábrica', () => {
    const f = defaultSettings();
    const s = rowToSettings({ tenant_id: 't', modules: {}, auto_reply: null, sla: { review: 9 } });
    expect(s.modules).toEqual(f.modules);
    expect(s.autoReply).toEqual(f.autoReply);
    expect(s.sla.review).toBe(9);
    expect(s.sla).toEqual({ ...f.sla, review: 9 });
  });
  it('ida y vuelta sin pérdida', () => {
    const s = defaultSettings();
    s.autoReply = { enabled: true, minScore: 85 };
    const row = settingsToRow('t', s);
    expect(row.tenant_id).toBe('t');
    expect(rowToSettings(row)).toEqual(s);
  });
});
