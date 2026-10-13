import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export type AutomationTrigger =
  | "message_received" | "conversation_created" | "conversation_assigned"
  | "status_changed" | "sla_breach" | "keyword" | "segment_entered"
  | "quote_accepted" | "order_confirmed" | "payment_received";

export interface Condition {
  readonly field: string;
  readonly operator: "eq" | "neq" | "contains" | "gt" | "lt" | "in";
  readonly value: unknown;
}

export interface Action {
  readonly type: string;
  readonly params: Readonly<Record<string, unknown>>;
}

export interface AutomationRuleState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly trigger: AutomationTrigger;
  readonly conditions: readonly Condition[];
  readonly actions: readonly Action[];
  readonly isActive: boolean;
  readonly priority: number;
}

export type AutomationError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "trigger_invalido" }
  | { readonly kind: "acciones_vacias" };

const TRIGGERS: readonly AutomationTrigger[] = [
  "message_received", "conversation_created", "conversation_assigned",
  "status_changed", "sla_breach", "keyword", "segment_entered",
  "quote_accepted", "order_confirmed", "payment_received",
];

export const crearRegla = (
  tenantId: TenantId,
  name: string,
  trigger: AutomationTrigger,
  actions: readonly Action[],
  conditions: readonly Condition[] = [],
): Result<AutomationRuleState, AutomationError> => {
  if (!name?.trim()) return err({ kind: "nombre_vacio" });
  if (!TRIGGERS.includes(trigger)) return err({ kind: "trigger_invalido" });
  if (!actions || actions.length === 0) return err({ kind: "acciones_vacias" });
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    name: name.trim(),
    trigger,
    conditions: Object.freeze(conditions),
    actions: Object.freeze(actions),
    isActive: true,
    priority: 0,
  }));
};