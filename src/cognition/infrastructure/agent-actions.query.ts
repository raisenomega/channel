/**
 * HUB by Raisen — Dashboard: ULTIMA accion real de cada agente (1 linea honesta) desde agent_drafts
 * (lo mas reciente por persona). Deriva un texto corto segun lo que hizo. Service-role, filtro por tenant.
 * Cero sinteticos: el agente sin actividad no aparece (el front pone "en espera"). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface UltimaAccion { label: string; at: string; }

export async function ultimasAcciones(tenantId: string): Promise<Record<string, UltimaAccion>> {
  const { data } = await supabase.from("agent_drafts").select("persona_slug, created_at, metadata").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(500);
  const rows = (data ?? []) as Array<{ persona_slug?: string | null; created_at?: string | null; metadata?: { scope?: string; contactName?: string; contactLabel?: string } | null }>;
  const acc: Record<string, UltimaAccion> = {};
  for (const r of rows) {
    const k = r.persona_slug || "";
    if (!k || acc[k]) continue; // orden desc -> la primera por persona es la mas reciente
    const nombre = (r.metadata?.contactName || r.metadata?.contactLabel || "").trim();
    const scope = r.metadata?.scope;
    const label = scope === "quote" ? `coordino una cotizacion${nombre ? " para " + nombre : ""}`
      : scope === "strategic" ? `preparo un cierre${nombre ? " con " + nombre : ""}`
      : `contesto a ${nombre || "un cliente"}`;
    acc[k] = { label, at: r.created_at ?? "" };
  }
  return acc;
}
