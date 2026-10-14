/**
 * HUB by Raisen — Configuracion de Supabase.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface HubConfig {
  supabaseUrl: string;
  anonKey: string;
}

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

export function getSupabaseUrl(): string {
  return url;
}

export function getAnonKey(): string {
  return anonKey;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey);
  return client;
}