import { supabaseRestBase, supabaseAuthHeaders } from "./rest-base";
import type { RestRes } from "./types";

export async function restGet<T>(
  path: string,
  select?: string,
  opts?: { headers?: Record<string, string> },
): Promise<RestRes<T[]>> {
  const base = supabaseRestBase();
  const authHeaders = supabaseAuthHeaders();
  if (!base || !authHeaders) return { ok: false, kind: "config_incompleta" };
  const cols = select ?? "*";
  const url_final = `${base}/${path}?select=${encodeURIComponent(cols)}`;
  try {
    const res = await fetch(url_final, { headers: { ...authHeaders, ...opts?.headers } });
    if (res.status === 401 || res.status === 403) return { ok: false, kind: "no_autorizado" };
    if (!res.ok) return { ok: false, kind: "red", cause: `status ${res.status}` };
    const data = (await res.json()) as T[];
    return { ok: true, value: data };
  } catch (e) {
    return { ok: false, kind: "red", cause: String(e) };
  }
}

export async function restPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<RestRes<T>> {
  const base = supabaseRestBase();
  const authHeaders = supabaseAuthHeaders();
  if (!base || !authHeaders) return { ok: false, kind: "config_incompleta" };
  try {
    const res = await fetch(`${base}/${path}`, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, kind: "no_autorizado" };
    if (!res.ok) return { ok: false, kind: "red", cause: `status ${res.status}` };
    const data = (await res.json()) as T;
    return { ok: true, value: data };
  } catch (e) {
    return { ok: false, kind: "red", cause: String(e) };
  }
}

export async function restPatch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<RestRes<T>> {
  const base = supabaseRestBase();
  const authHeaders = supabaseAuthHeaders();
  if (!base || !authHeaders) return { ok: false, kind: "config_incompleta" };
  try {
    const res = await fetch(`${base}/${path}`, {
      method: "PATCH",
      headers: { ...authHeaders, "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, kind: "no_autorizado" };
    if (!res.ok) return { ok: false, kind: "red", cause: `status ${res.status}` };
    const data = (await res.json()) as T;
    return { ok: true, value: data };
  } catch (e) {
    return { ok: false, kind: "red", cause: String(e) };
  }
}