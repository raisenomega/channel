/**
 * HUB by Raisen — Lee modo + config S7 del negocio (tenants.agents_autodraft + agents_config) y cuenta los
 * auto-enviados de hoy (para el tope diario). 'off' por defecto. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { AutodraftFlagPort, SentCounterPort } from "../application/maybe-autodraft.service.ts";
import type { AgentsConfig } from "../domain/agents-config.ts";
import { mergeConfig } from "../domain/agents-config.ts";

export class AutodraftFlagSupabase implements AutodraftFlagPort {
  async leer(tenantId: string): Promise<{ mode: string; config: AgentsConfig; timeZone?: string | undefined }> {
    const { data } = await supabase.from("tenants").select("agents_autodraft, agents_config, timezone").eq("id", tenantId).maybeSingle();
    const row = (data ?? {}) as { agents_autodraft?: string; agents_config?: unknown; timezone?: string };
    return { mode: row.agents_autodraft ?? "off", config: mergeConfig(row.agents_config), timeZone: row.timezone };
  }
}

export class SentCounterSupabase implements SentCounterPort {
  async contar(tenantId: string): Promise<number> {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const { count } = await supabase.from("agent_drafts").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("status", "sent").gte("sent_at", hoy.toISOString());
    return count ?? 0;
  }
}
