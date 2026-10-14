/**
 * HUB by Raisen — Funciones del cliente de automatizacion.
 */
import { supabaseRestBase, supabaseAuthHeaders, restPost } from "../supabase";
import type { RowAutomationRule } from "../types";
import type { Result, RawRule, RuleListItem } from "./types";

function mapear(r: RawRule): RuleListItem {
  return {
    id: r.id,
    name: r.name,
    triggerEvent: r.trigger_event,
    actionType: r.action_type,
    actionConfig: r.action_config,
    enabled: r.enabled,
    createdAt: r.created_at,
  };
}

export async function listarReglas(): Promise<Result<RuleListItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const cols = ["id", "name", "trigger_event", "action_type", "action_config", "enabled", "created_at"];
  const url = `${base}/automation_rules?select=${encodeURIComponent(cols.join(","))}&order=created_at.desc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (res.status === 404) return { ok: true, value: [] };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawRule[];
    return { ok: true, value: filas.map(mapear) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function crearRegla(data: {
  name: string;
  trigger_event: string;
  action_type: string;
  action_config?: Record<string, unknown>;
}): Promise<Result<RowAutomationRule>> {
  const res = await restPost<RowAutomationRule>("automation_rules", {
    ...data,
    enabled: true,
    action_config: data.action_config ?? {},
  });
  if (!res.ok) {
    return { ok: false, error: { kind: res.kind === "no_autorizado" ? "no_autorizado" : "red", cause: res.cause } };
  }
  return { ok: true, value: res.value };
}