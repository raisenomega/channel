/**
 * HUB by Raisen — Repositorio Supabase de reglas de automatizacion.
 * Implementa AutomationRuleRepository. Patron notifications.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { AutomationRuleState, Condition, Action } from "../domain/automation.entity.ts";
import type { AutomationTrigger } from "../domain/automation.entity.ts";
import type { AutomationRuleRepository, RepoError } from "../domain/automation.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface AutomationRuleRow {
  id: string; tenant_id: string; name: string; trigger: string;
  conditions: unknown; actions: unknown; is_active: boolean; priority: number;
}

function toEntity(r: AutomationRuleRow): AutomationRuleState {
  return {
    id: r.id,
    tenantId: r.tenant_id as TenantId,
    name: r.name,
    trigger: r.trigger as AutomationTrigger,
    conditions: Array.isArray(r.conditions) ? r.conditions as readonly Condition[] : [],
    actions: Array.isArray(r.actions) ? r.actions as readonly Action[] : [],
    isActive: r.is_active,
    priority: r.priority,
  };
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseAutomationRuleRepo implements AutomationRuleRepository {
  async guardar(rule: AutomationRuleState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/automation_rules`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: rule.id, tenant_id: rule.tenantId, name: rule.name, trigger: rule.trigger, conditions: rule.conditions, actions: rule.actions, is_active: rule.isActive, priority: rule.priority }),
      });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscarActivas(tenantId: TenantId, trigger: string): Promise<Result<AutomationRuleState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/automation_rules?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&trigger=eq.${encodeURIComponent(trigger)}&is_active=eq.true&order=priority.desc`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as AutomationRuleRow[];
      return ok(rows.map(toEntity));
    } catch (e) { return err(mapErr(String(e))); }
  }
}