/**
 * HUB by Raisen — Sistema B fase 1: busca conversaciones quietas (status abierto/pendiente, con
 * last_message_at < umbral). Lectura pura (el trigger 054 llena last_message_at). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { QuietConv } from "../application/followup-scanner.ts";

export async function conversacionesQuietas(horasQuieto: number, limite = 50): Promise<readonly QuietConv[]> {
  const umbral = new Date(Date.now() - horasQuieto * 3_600_000).toISOString();
  const { data } = await supabase.from("conversations")
    .select("id, tenant_id, contact_id, last_message_at, primary_channel, participant_external_id")
    .in("status", ["open", "pending"])
    .not("last_message_at", "is", null)
    .lt("last_message_at", umbral)
    .order("last_message_at", { ascending: true })
    .limit(limite);
  const rows = (data ?? []) as Array<{ id: string; tenant_id: string; contact_id: string | null; last_message_at: string | null; primary_channel: string | null; participant_external_id: string | null }>;
  return rows.map((r) => ({ id: r.id, tenantId: r.tenant_id, contactId: r.contact_id, lastMessageAt: r.last_message_at, channel: r.primary_channel ?? undefined, participantExternalId: r.participant_external_id }));
}
