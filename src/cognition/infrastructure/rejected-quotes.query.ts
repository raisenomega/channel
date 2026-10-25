/**
 * HUB by Raisen — #3/#4: cotizaciones del agente RECHAZADAS. Se quedan 30 dias visibles en Borradores con
 * etiqueta "Cotizacion rechazada" y luego se AUTO-BORRAN. Esta query barre las de >30 dias (delete) y
 * devuelve las recientes (<=30 dias). Service-role; filtro explicito por tenant. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const MS_30D = 30 * 86400000;

export async function cotizacionesRechazadasRecientes(tenantId: string): Promise<Array<Record<string, unknown>>> {
  const corte = new Date(Date.now() - MS_30D).toISOString();
  try {
    await supabase.from("agent_drafts").delete().eq("tenant_id", tenantId).eq("status", "rejected").eq("metadata->>scope", "quote").lt("created_at", corte);
    const { data } = await supabase.from("agent_drafts").select("id, created_at, metadata").eq("tenant_id", tenantId).eq("status", "rejected").eq("metadata->>scope", "quote").gte("created_at", corte).order("created_at", { ascending: false });
    return (data ?? []) as Array<Record<string, unknown>>;
  } catch { return []; }
}
