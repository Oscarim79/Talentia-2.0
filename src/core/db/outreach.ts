import { supabase } from '../supabase';
import type { OutreachChannel, OutreachMessage, OutreachStatus } from '../../types';
import { nullToUndefined, stripUndefined } from './rows';

/** Fila de `public.outreach_messages`. */
export interface OutreachMessageRow {
  id: string;
  tenant_id: string;
  candidate_id: string;
  candidate_name: string | null;
  job_id: string | null;
  channel: string | null;
  to: string | null;
  body: string | null;
  status: string | null;
  sent_at: string | null; // timestamptz
  slot: string | null;
  confirmed_slot: string | null;
  inserted_at?: string; // lo pone la base de datos
}

export type OutreachPatch = Partial<Pick<OutreachMessage, 'status' | 'confirmedSlot'>>;

export function rowToMessage(r: OutreachMessageRow): OutreachMessage {
  return stripUndefined({
    id: r.id,
    tenantId: r.tenant_id,
    candidateId: r.candidate_id,
    candidateName: r.candidate_name ?? '',
    jobId: r.job_id ?? '',
    channel: (r.channel ?? 'email') as OutreachChannel,
    to: r.to ?? '',
    body: r.body ?? '',
    status: (r.status ?? 'queued') as OutreachStatus,
    sentAt: r.sent_at ?? '',
    slot: nullToUndefined(r.slot),
    confirmedSlot: nullToUndefined(r.confirmed_slot),
  });
}

export function messageToRow(m: OutreachMessage): OutreachMessageRow {
  return {
    id: m.id,
    tenant_id: m.tenantId,
    candidate_id: m.candidateId,
    candidate_name: m.candidateName,
    job_id: m.jobId,
    channel: m.channel,
    to: m.to,
    body: m.body,
    status: m.status,
    sent_at: m.sentAt,
    slot: m.slot ?? null,
    confirmed_slot: m.confirmedSlot ?? null,
  };
}

export async function listMessages(tenantId: string): Promise<OutreachMessage[]> {
  const { data, error } = await supabase
    .from('outreach_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sent_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as OutreachMessageRow[]).map(rowToMessage);
}

export async function insertMessage(m: OutreachMessage): Promise<void> {
  const { error } = await supabase.from('outreach_messages').insert(messageToRow(m));
  if (error) throw error;
}

export async function updateMessage(id: string, patch: OutreachPatch): Promise<void> {
  const row: Partial<OutreachMessageRow> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if ('confirmedSlot' in patch) row.confirmed_slot = patch.confirmedSlot ?? null;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('outreach_messages').update(row).eq('id', id);
  if (error) throw error;
}
