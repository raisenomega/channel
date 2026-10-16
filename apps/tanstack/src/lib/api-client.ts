/**
 * HUB by Raisen — Cliente del API HUB (Railway) con JWT de la sesion Supabase (Hotfix G).
 * Regla firme: apiFetch NUNCA inyecta un token que no venga de la sesion local actual.
 * Sin sesion -> lanza Error("no_session") y NO llama a fetch.
 * resolveTenantId: app_metadata.tenant_id del JWT > tenant recordado tras crear > null.
 */
import { readLocalSession } from "./auth";
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

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = readLocalSession()?.access_token;
  if (!token) throw new Error("no_session");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return fetch(`${getHubApiUrl()}${path}`, { ...init, headers });
}
