import { describe, expect, it } from 'vitest';
import { JOBS } from '../../data/seed';
import { jobToRow, rowToJob } from './jobs';

describe('jobs mapper', () => {
  it('ida y vuelta sin pérdida (vacante completa)', () => {
    const j = JOBS.find((x) => x.interviewGuide)!;
    expect(rowToJob(jobToRow(j))).toEqual(j);
  });
  it('sin interviewGuide: se guarda null y vuelve ausente', () => {
    const j = JOBS.find((x) => !x.interviewGuide)!;
    const row = jobToRow(j);
    expect(row.interview_guide).toBeNull();
    const back = rowToJob(row);
    expect(back.interviewGuide).toBeUndefined();
    expect(back).toEqual(j);
  });
});
