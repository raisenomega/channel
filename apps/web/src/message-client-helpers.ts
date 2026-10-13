/**
 * HUB by Raisen — Tipos y config para el cliente de mensajes.
 * Separado de message-client.ts para cumplir C4 (<75 líneas cada uno).
 */
export interface MensajeError {
  readonly kind: "sin_sesion" | "no_autorizado" | "red";
  readonly cause?: string;
}

interface HubCfg {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

export function cfg(): HubCfg {
  const g = globalThis as Record<string, unknown>;
  const c = g.__HUB_CONFIG__ as HubCfg | undefined;
  return { supabaseUrl: c?.supabaseUrl ?? "", anonKey: c?.anonKey ?? "" };
}

export const enc = (s: string): string => encodeURIComponent(s);