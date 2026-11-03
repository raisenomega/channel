/**
 * HUB by Raisen — #7 control de costo LLM por tenant. Suma el gasto del dia (agent_usage.cost_usd, que YA se
 * mide en recordAgentUsage) para que el pipeline DEGRADE (no llame al LLM) cuando el tenant supera su
 * presupuesto diario -> evita factura ilimitada ante un tenant abusivo / bucle / rafaga de spam. Indice
 * (tenant_id, created_at) en agent_usage (migr 097). Optimizacion futura: contador materializado. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function gastoLlmHoy(tenantId: string): Promise<number> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const { data } = await supabase.from("agent_usage").select("cost_usd")
    .eq("tenant_id", tenantId).gte("created_at", hoy.toISOString()).limit(20000);
  return ((data ?? []) as Array<{ cost_usd?: number | string }>).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
}
