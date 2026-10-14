import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readLocalSession, clearLocalSession } from "./auth";

interface HubConfig {
  supabaseUrl: string;
  anonKey: string;
}

/** Lee config inyectada en runtime (window.__HUB_CONFIG__) con fallback a VITE_*.
 *  La publishable anon key es publica y segura de exponer en el bundle. */
function readHubConfig(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return {
    supabaseUrl: cfg?.supabaseUrl ?? (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "",
    anonKey: cfg?.anonKey ?? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "",
  };
}

const { url, anonKey } = (() => {
  const c = readHubConfig();
  return { url: c.supabaseUrl, anonKey: c.anonKey };
})();

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}

/** Headers para llamadas REST directas a Supabase con JWT del usuario. */
export function supabaseAuthHeaders(): Record<string, string> | null {
  const session = readLocalSession();
  if (!session?.access_token || !anonKey) return null;
  // Decodifica el payload del JWT para detectar expiración (>5s de margen).
  const payload = decodeJwt(session.access_token);
  if (payload && payload.exp) {
    const expMs = payload.exp * 1000;
    if (expMs < Date.now() + 5000) {
      clearLocalSession();
      return null;
    }
  }
  return {
    apikey: anonKey,
    authorization: `Bearer ${session.access_token}`,
    accept: "application/json",
  };
}

/** Decodifica el payload de un JWT sin verificar firma (solo lectura de exp). */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1] ?? "";
    const padded = base64.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(payload) as { exp?: number };
  } catch {
    return null;
  }
}

/** URL base REST de Supabase. */
export function supabaseRestBase(): string | null {
  if (!url) return null;
  return `${url}/rest/v1`;
}

export interface RestResult<T> {
  ok: true; value: T;
}

export interface RestError {
  ok: false; kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string;
}

export type RestRes<T> = RestResult<T> | RestError;

/** GET tipado a Supabase REST. */
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

/** POST a Supabase REST, retorna el body creado. */
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
      headers: {
        ...authHeaders,
        "content-type": "application/json",
        prefer: "return=representation",
      },
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

/** PATCH a Supabase REST (upsert por primary key). */
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
      headers: {
        ...authHeaders,
        "content-type": "application/json",
        prefer: "return=representation",
      },
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
