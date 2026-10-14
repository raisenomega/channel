/**
 * HUB by Raisen — Config y cabezsras del cliente SAFE.
 */
import type { SessionUsuario } from "./auth-client.ts";

export type SafeDataError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

export function safeCfg(): { supabaseUrl: string; anonKey: string } {
  return config();
}

export function safeAuth(s: SessionUsuario, anonKey: string): Record<string, string> {
  return { apikey: anonKey, authorization: `Bearer ${s.accessToken}`, accept: "application/json" };
}