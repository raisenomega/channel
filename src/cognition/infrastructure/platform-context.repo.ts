/**
 * HUB by Raisen — Lee el contexto de plataforma (B2 canales conectados + B3 humanos que atienden) desde
 * channel_connections y agents. Service-role; filtra por el tenant del claim. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { PlatformContext } from "../domain/platform-context.ts";

type Ch = { platform?: string; status?: string; is_paused?: boolean };
type Ag = { display_name?: string; role?: string; agent_type?: string; is_active?: boolean };
type It = { name?: string; unit_price?: number; item_type?: string };

export async function leerPlatformContext(tenantId: string): Promise<PlatformContext> {
  const { data: ch } = await supabase.from("channel_connections").select("platform, status, is_paused").eq("tenant_id", tenantId);
  const { data: ag } = await supabase.from("agents").select("display_name, role, agent_type, is_active").eq("tenant_id", tenantId);
  const { data: it } = await supabase.from("items").select("name, unit_price, item_type").eq("tenant_id", tenantId).limit(20);
  const channels = ((ch ?? []) as Ch[])
    .filter((r) => r.status === "connected" && !r.is_paused)
    .map((r) => String(r.platform ?? ""));
  const humanAgents = ((ag ?? []) as Ag[])
    .filter((r) => r.agent_type === "human" && r.is_active === true)
    .map((r) => `${r.display_name ?? ""} (${r.role ?? ""})`);
  const catalog = ((it ?? []) as It[]).map((r) => `${r.name ?? ""} ($${r.unit_price ?? 0}, ${r.item_type ?? ""})`);
  return { channels, humanAgents, catalog };
}
