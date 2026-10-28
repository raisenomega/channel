/**
 * HUB by Raisen — Lee el conocimiento ACTIVO del agente (agent_knowledge, migr 015): lo que el dueno
 * ya respondio/enseno. Se inyecta en el contexto -> el agente lo CITA. Orden por confianza, tope 30
 * para no inflar el prompt. RLS por tenant. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { AgentKnowledgeState } from "../domain/agent.service.ts";
import type { TenantId } from "../../shared/domain/ids.ts";

type Row = { id: string; category: string; knowledge: string; confidence: number; times_applied: number; times_confirmed: number; times_corrected: number; status: string };

export async function leerKnowledge(tenantId: string): Promise<readonly AgentKnowledgeState[]> {
  const { data } = await supabase.from("agent_knowledge")
    .select("id, category, knowledge, confidence, times_applied, times_confirmed, times_corrected, status")
    .eq("tenant_id", tenantId).eq("status", "active")
    .order("confidence", { ascending: false }).limit(30);
  return ((data ?? []) as Row[]).map((r) => Object.freeze({
    id: String(r.id), tenantId: tenantId as TenantId, category: r.category as AgentKnowledgeState["category"],
    knowledge: String(r.knowledge), confidence: Number(r.confidence ?? 0),
    timesApplied: Number(r.times_applied ?? 0), timesConfirmed: Number(r.times_confirmed ?? 0),
    timesCorrected: Number(r.times_corrected ?? 0), status: r.status as AgentKnowledgeState["status"],
  }));
}
