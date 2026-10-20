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
