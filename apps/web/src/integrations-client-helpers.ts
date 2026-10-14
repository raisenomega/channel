/**
 * HUB by Raisen — Config y sesión del cliente de integraciones.
 */
import { auth, type SessionUsuario } from "./auth-client.ts";

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

export function hubConfig(): { supabaseUrl: string; anonKey: string } {
  return config();
}

export function sesion(): SessionUsuario | null {
  try {
    return auth.leer();
  } catch {
    return null;
  }
}