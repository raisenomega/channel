/**
 * HUB by Raisen — Lee el contexto de plataforma (B2 canales conectados + B3 humanos que atienden) desde
 * channel_connections y agents. Service-role; filtra por el tenant del claim. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { PlatformContext } from "../domain/platform-context.ts";

type Ch = { platform?: string; status?: string; is_paused?: boolean };
type Ag = { display_name?: string; role?: string; agent_type?: string; is_active?: boolean };

export async function leerPlatformContext(tenantId: string): Promise<PlatformContext> {
  const { data: ch } = await supabase.from("channel_connections").select("platform, status, is_paused").eq("tenant_id", tenantId);
  const { data: ag } = await supabase.from("agents").select("display_name, role, agent_type, is_active").eq("tenant_id", tenantId);
  const channels = ((ch ?? []) as Ch[])
    .filter((r) => r.status === "connected" && !r.is_paused)
    .map((r) => String(r.platform ?? ""));
  const humanAgents = ((ag ?? []) as Ag[])
    .filter((r) => r.agent_type === "human" && r.is_active === true)
    .map((r) => `${r.display_name ?? ""} (${r.role ?? ""})`);
  return { channels, humanAgents };
}
