/**
 * HUB by Raisen — Registro de uso/costo REAL por respuesta IA en agent_usage (model + tokens + cache_read
 * para verificar prompt caching y ruteo Haiku/Sonnet, y medir costo). Fail-safe: NUNCA bloquea la respuesta.
 * Service-role via REST. C4 <=75. Sin any.
 */
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export interface AgentUsageInput {
  readonly tenantId: string;
  readonly conversationId: string | null;
  readonly personaSlug: string;
  readonly model: string;
  readonly costUsd: number;
  readonly tokens: { readonly input: number; readonly output: number; readonly cacheRead: number; readonly cacheCreation: number };
}

export async function recordAgentUsage(i: AgentUsageInput): Promise<void> {
  try {
    const base = supabaseBase();
    const hdrs = supabaseHdrs();
    if (!base || !hdrs) return; // sin service-role: no-op honesto
    await fetch(`${base}/agent_usage`, {
      method: "POST",
      headers: { ...hdrs, Prefer: "return=minimal" },
      body: JSON.stringify({
        tenant_id: i.tenantId, conversation_id: i.conversationId, persona_slug: i.personaSlug,
        model: i.model, tokens_input: i.tokens.input, tokens_output: i.tokens.output,
        cache_read: i.tokens.cacheRead, cache_creation: i.tokens.cacheCreation, cost_usd: i.costUsd,
      }),
    });
  } catch { /* fail-safe: la metrica de costo nunca interrumpe la respuesta al cliente */ }
}
