/**
 * HUB by Raisen — accountId de WhatsApp del tenant (channel_connections).
 * Zernio exige accountId al crear/importar plantillas. Degrade-safe. C4 ≤75.
 */
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export async function obtenerWhatsAppAccountId(tenantId: string): Promise<string | null> {
  const u = supabaseBase();
  const h = supabaseHdrs();
  if (!u || !h) return null;
  try {
    const q = `?select=zernio_account_id&tenant_id=eq.${encodeURIComponent(tenantId)}&platform=eq.whatsapp&limit=1`;
    const r = await fetch(`${u}/channel_connections${q}`, { headers: h });
    if (!r.ok) return null;
    const rows = (await r.json()) as ReadonlyArray<{ zernio_account_id: string | null }>;
    return rows[0]?.zernio_account_id ?? null;
  } catch {
    return null;
  }
}
