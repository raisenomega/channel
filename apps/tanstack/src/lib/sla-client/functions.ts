import { supabaseRestBase, supabaseAuthHeaders, restPost } from "../supabase";
import type { RowSlaPolicy, RowBusinessHours } from "../types";
import type { Result, RawSla, RawHours, SlaPolicyItem, BusinessHoursItem } from "./types";

function mapSla(r: RawSla): SlaPolicyItem {
  return { id: r.id, channel: r.channel, maxResponseMinutes: r.max_response_minutes, enabled: r.enabled };
}

function mapHours(r: RawHours): BusinessHoursItem {
  return { id: r.id, dayOfWeek: r.day_of_week, openTime: r.open_time, closeTime: r.close_time, enabled: r.enabled };
}

export async function listarSlaPolicies(): Promise<Result<SlaPolicyItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const url = `${base}/sla_policies?select=*&order=channel.asc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (res.status === 404) return { ok: true, value: [] };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawSla[];
    return { ok: true, value: filas.map(mapSla) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function listarBusinessHours(): Promise<Result<BusinessHoursItem[]>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  const url = `${base}/business_hours?select=*&order=day_of_week.asc`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (res.status === 404) return { ok: true, value: [] };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const filas = (await res.json()) as RawHours[];
    return { ok: true, value: filas.map(mapHours) };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function upsertSlaPolicy(data: {
  channel: string;
  max_response_minutes: number;
  enabled?: boolean;
}): Promise<Result<RowSlaPolicy>> {
  const res = await restPost<RowSlaPolicy>("sla_policies", { ...data, enabled: data.enabled ?? true });
  if (!res.ok) {
    return { ok: false, error: { kind: res.kind === "no_autorizado" ? "no_autorizado" : "red", cause: res.cause } };
  }
  return { ok: true, value: res.value };
}

export async function upsertBusinessHours(data: {
  day_of_week: number;
  open_time: string;
  close_time: string;
  enabled?: boolean;
}): Promise<Result<RowBusinessHours>> {
  const res = await restPost<RowBusinessHours>("business_hours", { ...data, enabled: data.enabled ?? true });
  if (!res.ok) {
    return { ok: false, error: { kind: res.kind === "no_autorizado" ? "no_autorizado" : "red", cause: res.cause } };
  }
  return { ok: true, value: res.value };
}