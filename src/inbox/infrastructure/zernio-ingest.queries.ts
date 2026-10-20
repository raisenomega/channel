/**
 * HUB by Raisen — Hotfix P bloque 2: queries del ingest Zernio (infra). tenant por zernio_profile_id
 * (resolución del tenant del mensaje) + dedup por provider_message_id (idempotencia #154). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export async function tenantPorZernioProfile(profileId: string): Promise<TenantId | null> {
  if (!profileId) return null;
  const { data } = await supabase.from("tenants").select("id").eq("zernio_profile_id", profileId).limit(1);
  const row = Array.isArray(data) ? data[0] as { id?: string } : null;
  return (row?.id as TenantId) ?? null;
}

export async function mensajeYaExiste(tenantId: TenantId, providerMessageId: string): Promise<boolean> {
  if (!providerMessageId) return false;
  const { data } = await supabase.from("messages").select("id").eq("tenant_id", tenantId).eq("provider_message_id", providerMessageId).limit(1);
  return Array.isArray(data) && data.length > 0;
}

export async function conversacionExiste(convId: string): Promise<boolean> {
  if (!convId) return false;
  const { data } = await supabase.from("conversations").select("id").eq("id", convId).limit(1);
  return Array.isArray(data) && data.length > 0;
}

// Issue C: fallback de tenant por la cuenta Zernio enlazada (channel_connections.zernio_account_id).
export async function tenantPorZernioAccount(accountId: string): Promise<TenantId | null> {
  if (!accountId) return null;
  const { data } = await supabase.from("channel_connections").select("tenant_id").eq("zernio_account_id", accountId).limit(1);
  const row = Array.isArray(data) ? data[0] as { tenant_id?: string } : null;
  return (row?.tenant_id as TenantId) ?? null;
}

// 3o-b: rellena el id del destinatario en convs ya existentes (solo si está NULL -> idempotente,
// no toca otras columnas -> no reabre Issue A). Habilita la entrega saliente a Zernio.
export async function setConvParticipant(convId: string, externalId: string): Promise<void> {
  if (!convId || !externalId) return;
  await supabase.from("conversations").update({ participant_external_id: externalId }).eq("id", convId).is("participant_external_id", null);
}

// #3: actualiza el nombre del contacto cuando llega uno real (solo si cambió). Nunca el nombre del negocio
// (el parser ya no lo usa). Deja intactos los que ya coinciden.
export async function refreshContactName(contactId: string, name: string): Promise<void> {
  if (!contactId || !name) return;
  await supabase.from("contacts").update({ display_name: name }).eq("id", contactId).neq("display_name", name);
}
