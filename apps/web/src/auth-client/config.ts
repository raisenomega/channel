/**
 * HUB by Raisen — Config y cabeceras del cliente de auth.
 */
export const TOKEN = "hub.session";

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

export function getConfig(): { supabaseUrl: string; anonKey: string } {
  return config();
}

export function cabeceras(extra?: Record<string, string>): RequestInit {
  const { anonKey } = config();
  return {
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
      ...extra,
    },
    method: "POST",
  };
}