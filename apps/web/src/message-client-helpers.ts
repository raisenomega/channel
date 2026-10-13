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
  /** Canal simulado de desarrollo: enruta la escritura via dev-channel. */
  readonly devChannelEnabled: boolean;
}

export function cfg(): HubCfg {
  const g = globalThis as Record<string, unknown>;
  const c = g.__HUB_CONFIG__ as Partial<HubCfg> | undefined;
  return {
    supabaseUrl: c?.supabaseUrl ?? "",
    anonKey: c?.anonKey ?? "",
    devChannelEnabled: c?.devChannelEnabled === true,
  };
}

export const enc = (s: string): string => encodeURIComponent(s);