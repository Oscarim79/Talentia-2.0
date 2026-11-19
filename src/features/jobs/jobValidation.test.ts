import { describe, expect, it } from 'vitest';
import { validateJobBasics } from './jobValidation';

const ok = { title: 'Asesor de Ventas', department: 'Ventas', salaryMin: 4000, salaryMax: 6000 };

describe('validateJobBasics (paso 1 del wizard de vacantes)', () => {
  it('con todo en orden no hay errores', () => {
    expect(validateJobBasics(ok)).toEqual({});
  });

  it('el título necesita al menos 2 letras', () => {
    expect(validateJobBasics({ ...ok, title: ' ' }).title).toBe('Escribe el título del puesto (mínimo 2 letras).');
    expect(validateJobBasics({ ...ok, title: 'A' }).title).toBeTruthy();
  });

  it('el departamento es obligatorio', () => {
    expect(validateJobBasics({ ...ok, department: '' }).department).toBe('Escribe el departamento (mínimo 2 letras).');
  });

  it('el salario máximo no puede ser menor que el mínimo', () => {
    const errors = validateJobBasics({ ...ok, salaryMin: 7000, salaryMax: 6000 });
    expect(errors.salaryMax).toBe('El salario máximo debe ser mayor o igual que el mínimo.');
    expect(errors.title).toBeUndefined();
  });

  it('varios errores a la vez se reportan todos', () => {
    const errors = validateJobBasics({ title: '', department: '', salaryMin: 9, salaryMax: 1 });
    expect(Object.keys(errors).sort()).toEqual(['department', 'salaryMax', 'title']);
  });
});
