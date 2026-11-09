-- 0005: origen de la evaluación y fecha obligatoria en acciones de Talento.

-- Origen de la evaluación: 'ai' (la hizo el asistente de IA) o 'human' (una persona).
-- Nulo = evaluación hecha por una persona en la app, como hasta ahora.
alter table public.interview_evaluations
  add column if not exists source text check (source in ('ai', 'human'));

-- La fecha en que se marcó la acción la pone la base de datos.
update public.talent_actions_done set done_at = now() where done_at is null;
alter table public.talent_actions_done alter column done_at set default now();
alter table public.talent_actions_done alter column done_at set not null;
