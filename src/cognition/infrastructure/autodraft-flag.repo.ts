/**
 * HUB by Raisen — Lee el flag agents_autodraft del negocio (tenants). 'off' por defecto. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { AutodraftFlagPort } from "../application/maybe-autodraft.service.ts";

export class AutodraftFlagSupabase implements AutodraftFlagPort {
  async leer(tenantId: string): Promise<string> {
    const { data } = await supabase.from("tenants").select("agents_autodraft").eq("id", tenantId).maybeSingle();
    return (data as { agents_autodraft?: string } | null)?.agents_autodraft ?? "off";
  }
}
