import { supabase } from '../supabase';

/** Pregunta hecha al chat de ayuda (se registra para mejorar la guía). */
export interface HelpQuestion {
  id: string;
  at: string;
  route: string;
  question: string;
  answered: boolean;
}

/** Fila de `public.help_questions`. */
export interface HelpQuestionRow {
  id: string;
  tenant_id: string;
  member_id: string | null;
  route: string | null;
  question: string | null;
  answered: boolean | null;
  asked_at: string; // timestamptz
}

export function rowToQuestion(r: HelpQuestionRow): HelpQuestion {
  return {
    id: r.id,
    at: r.asked_at,
    route: r.route ?? '',
    question: r.question ?? '',
    answered: r.answered ?? false,
  };
}

export async function listQuestions(tenantId: string): Promise<HelpQuestion[]> {
  const { data, error } = await supabase
    .from('help_questions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('asked_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as HelpQuestionRow[]).map(rowToQuestion);
}

/** Inserta la pregunta; `id` y `asked_at` los genera la base de datos. */
export async function insertQuestion(
  tenantId: string,
  memberId: string | null,
  q: Omit<HelpQuestion, 'id' | 'at'>,
): Promise<HelpQuestion> {
  const { data, error } = await supabase
    .from('help_questions')
    .insert({
      tenant_id: tenantId,
      member_id: memberId,
      route: q.route,
      question: q.question,
      answered: q.answered,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToQuestion(data as HelpQuestionRow);
}

export async function deleteQuestions(tenantId: string): Promise<void> {
  const { error } = await supabase.from('help_questions').delete().eq('tenant_id', tenantId);
  if (error) throw error;
}
