/**
 * HUB by Raisen — Tipos del cliente de automatizacion.
 */

export type AutomationError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: AutomationError };

export interface RawRule {
  id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  action_config: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
}

export interface RuleListItem {
  id: string;
  name: string;
  triggerEvent: string;
  actionType: string;
  actionConfig: Record<string, unknown> | null;
  enabled: boolean;
  createdAt: string;
}