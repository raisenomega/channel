/**
 * HUB by Raisen — Configuracion de Supabase + URL del backend HUB (Railway).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface HubConfig {
  supabaseUrl: string;
  anonKey: string;
  /** Base del API HUB (Railway). Vacio = mismo origen (solo dev con proxy). Hotfix G. */
  hubApiUrl?: string;
}

function readHubConfig(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return {
    supabaseUrl: cfg?.supabaseUrl ?? (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "",
    anonKey: cfg?.anonKey ?? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "",
    hubApiUrl: cfg?.hubApiUrl ?? (import.meta.env.VITE_HUB_API_URL as string | undefined) ?? "",
  };
}

const { url, anonKey, hubApiUrl } = (() => {
  const c = readHubConfig();
  return { url: c.supabaseUrl, anonKey: c.anonKey, hubApiUrl: (c.hubApiUrl ?? "").replace(/\/+$/, "") };
})();

export function getSupabaseUrl(): string {
  return url;
}

export function getAnonKey(): string {
  return anonKey;
}

export function getHubApiUrl(): string {
  return hubApiUrl;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}
