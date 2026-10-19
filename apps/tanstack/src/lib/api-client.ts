/**
 * HUB by Raisen — Cliente del API HUB (Railway) con JWT de la sesion Supabase (Hotfix G).
 * Regla firme: apiFetch NUNCA inyecta un token que no venga de una sesion real.
 * Token: hub.session local; si falta (stale/desincronizada), cae al SDK (fuente de verdad,
 * auto-refresca) y re-persiste. Solo lanza "no_session" si NO hay sesion viva en ningun lado.
 * resolveTenantId: app_metadata.tenant_id del JWT > tenant recordado tras crear > null.
 */
import { readLocalSession, writeLocalSession } from "./auth";
import { getSupabase } from "./supabase";
import { getHubApiUrl } from "./supabase/config";

const TENANT_KEY = "hub.tenant_id";

export function resolveTenantId(): string | null {
  const session = readLocalSession();
  const meta = session?.user?.app_metadata as Record<string, unknown> | undefined;
  const delJwt = meta?.tenant_id;
  if (typeof delJwt === "string" && delJwt) return delJwt;
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(TENANT_KEY) || null; } catch { return null; }
}

export function rememberTenantId(tenantId: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(TENANT_KEY, tenantId); } catch { /* storage bloqueado: se resuelve via JWT */ }
}

/** Token de la sesion actual. hub.session primero; si no hay, consulta el SDK (sb-*; refresca si
 * caduco) y re-sincroniza hub.session. Evita el "no_session" falso con sesion viva no espejada. */
async function tokenVigente(): Promise<string | null> {
  const local = readLocalSession()?.access_token;
  if (local) return local;
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) { writeLocalSession(data.session); return data.session.access_token; }
  } catch { /* sin sesion viva */ }
  return null;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await tokenVigente();
  if (!token) throw new Error("no_session");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return fetch(`${getHubApiUrl()}${path}`, { ...init, headers });
}
