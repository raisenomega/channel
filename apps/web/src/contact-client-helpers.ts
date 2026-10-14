/**
 * HUB by Raisen — Config y helpers HTTP del cliente de contacto.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { ContactError } from "./contact-client-types.ts";

type HubCfg = { supabaseUrl: string; anonKey: string };

export function cfg(): HubCfg {
  const g = globalThis as Record<string, unknown>;
  const c = g.__HUB_CONFIG__ as HubCfg | undefined;
  return { supabaseUrl: c?.supabaseUrl ?? "", anonKey: c?.anonKey ?? "" };
}

export function authHeader(anonKey: string, token: string): Record<string, string> {
  return { apikey: anonKey, authorization: `Bearer ${token}`, accept: "application/json" };
}

export async function getFilas(url: string, anonKey: string, token: string): Promise<Result<Array<Record<string, unknown>>, ContactError>> {
  try {
    const res = await fetch(url, { headers: authHeader(anonKey, token) });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    return ok((await res.json()) as Array<Record<string, unknown>>);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

export const enc = encodeURIComponent;