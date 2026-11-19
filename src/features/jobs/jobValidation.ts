/** Validación del paso 1 del wizard de vacantes: un mensaje por campo, para mostrarlo junto al campo. */

export interface JobBasics {
  title: string;
  department: string;
  salaryMin: number;
  salaryMax: number;
}

export type JobBasicsField = 'title' | 'department' | 'salaryMax';
export type JobBasicsErrors = Partial<Record<JobBasicsField, string>>;

export function validateJobBasics(b: JobBasics): JobBasicsErrors {
  const errors: JobBasicsErrors = {};
  if (b.title.trim().length < 2) errors.title = 'Escribe el título del puesto (mínimo 2 letras).';
  if (b.department.trim().length < 2) errors.department = 'Escribe el departamento (mínimo 2 letras).';
  if (b.salaryMin > b.salaryMax) errors.salaryMax = 'El salario máximo debe ser mayor o igual que el mínimo.';
  return errors;
}
