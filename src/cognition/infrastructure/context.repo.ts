/**
 * HUB by Raisen — Repo de contexto del negocio: lee tenants (campos de marca) + tenant_context
 * (alta senal + reglas P6) + conteo de items, y guarda ambos. Service-role; filtra por el tenant
 * del claim. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { BusinessContext } from "../domain/business-context.ts";

const TENANT_COLS = "industry, brand_services, brand_target_audience, brand_tone, brand_mission, operation_hours, expected_response_sla";
const CTX_COLS = "business_what, differentiator, custom_instructions, policies, main_goal, competitors, brand_promise, never_say, high_value_cases, quarter_goals, routing_criteria, escalation_triggers, high_risk_cases, never_automate, doubt_threshold";
const s = (v: string | null | undefined): string | undefined => (v && v.trim() ? v : undefined);

export async function leerContexto(tenantId: string): Promise<BusinessContext> {
  const { data: t } = await supabase.from("tenants").select(TENANT_COLS).eq("id", tenantId).maybeSingle();
  const { data: c } = await supabase.from("tenant_context").select(CTX_COLS).eq("tenant_id", tenantId).maybeSingle();
  const { count } = await supabase.from("items").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
  const tt = (t ?? {}) as Record<string, string | null>;
  const cc = (c ?? {}) as Record<string, string | null>;
  return {
    industry: s(tt.industry), brandServices: s(tt.brand_services), targetAudience: s(tt.brand_target_audience),
    brandTone: s(tt.brand_tone), brandMission: s(tt.brand_mission), operationHours: s(tt.operation_hours),
    responseSla: s(tt.expected_response_sla), businessWhat: s(cc.business_what), differentiator: s(cc.differentiator),
    customInstructions: s(cc.custom_instructions), policies: s(cc.policies), mainGoal: s(cc.main_goal),
    competitors: s(cc.competitors), brandPromise: s(cc.brand_promise), neverSay: s(cc.never_say),
    highValueCases: s(cc.high_value_cases), quarterGoals: s(cc.quarter_goals), routingCriteria: s(cc.routing_criteria),
    escalationTriggers: s(cc.escalation_triggers), highRiskCases: s(cc.high_risk_cases),
    neverAutomate: s(cc.never_automate), doubtThreshold: s(cc.doubt_threshold), hasProducts: (count ?? 0) > 0,
  };
}

export async function guardarContexto(tenantId: string, p: BusinessContext): Promise<void> {
  await supabase.from("tenants").update({
    industry: p.industry ?? null, brand_services: p.brandServices ?? null,
    brand_target_audience: p.targetAudience ?? null, brand_tone: p.brandTone ?? null,
    brand_mission: p.brandMission ?? null, operation_hours: p.operationHours ?? null,
    expected_response_sla: p.responseSla ?? null,
  }).eq("id", tenantId);
  await supabase.from("tenant_context").upsert({
    tenant_id: tenantId, business_what: p.businessWhat ?? null, differentiator: p.differentiator ?? null,
    custom_instructions: p.customInstructions ?? null, policies: p.policies ?? null,
    main_goal: p.mainGoal ?? null, competitors: p.competitors ?? null, brand_promise: p.brandPromise ?? null,
    never_say: p.neverSay ?? null, high_value_cases: p.highValueCases ?? null, quarter_goals: p.quarterGoals ?? null,
    routing_criteria: p.routingCriteria ?? null, escalation_triggers: p.escalationTriggers ?? null,
    high_risk_cases: p.highRiskCases ?? null, never_automate: p.neverAutomate ?? null, doubt_threshold: p.doubtThreshold ?? null,
  }, { onConflict: "tenant_id" });
}
