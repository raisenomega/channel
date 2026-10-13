/**
 * HUB by Raisen — Cliente de telemetria (publica eventos a la DB)
 * El vigia registra eventos en `app_events` para historico y consulta.
 * Usa el JWT del usuario autenticado (insert permitido por RLS).
 */
import { auth } from "./auth-client.ts";

interface HubConfig {
  readonly supabaseUrl: string;
  readonly anonKey: string;
}

export interface Evento {
  readonly nivel: "debug" | "info" | "warn" | "error";
  readonly mensaje: string;
  readonly fase?: string;
  readonly causa?: string;
  readonly url?: string;
}

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

// Envia el evento a la DB. Silencioso ante fallos (la telemetria no debe
// romper el flujo de la app).
export async function publicar(evento: Evento): Promise<void> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return;
  const sesion = auth.leer();
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_events`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${sesion?.accessToken ?? ""}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        nivel: evento.nivel,
        mensaje: evento.mensaje,
        fase: evento.fase ?? null,
        causa: evento.causa ?? null,
        url: evento.url ?? (typeof location !== "undefined" ? location.pathname : null),
      }),
    });
    void res;
  } catch {
    // ignora fallos de telemetria
  }
}