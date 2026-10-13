/**
 * HUB by Raisen — Datos del inbox (solo tenant del usuario via RLS)
 * Consulta conversations con el JWT del usuario; el RLS filtra por tenant.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { SessionUsuario } from "./auth-client.ts";
import type { InboxItem } from "./types.ts";

export type InboxDataError =
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

export async function cargarInbox(s: SessionUsuario): Promise<Result<InboxItem[], InboxDataError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return err({ kind: "config_incompleta" });
  try {
    const cols = ["id", "contact_id", "status", "primary_channel", "last_message_at", "assigned_agent_id"];
    const url = `${supabaseUrl}/rest/v1/conversations?select=${cols.join(",")}&order=last_message_at.desc&limit=50`;
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${s.accessToken}`,
        accept: "application/json",
      },
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    const filas = (await res.json()) as Array<Record<string, unknown>>;
    const items: InboxItem[] = filas.map((r) =>
      Object.freeze({
        conversationId: String(r.id),
        contactName: String(r.contact_id ?? "Desconocido"),
        channel: String(r.primary_channel ?? "whatsapp"),
        lastMessage: "Conversacion del tenant",
        lastMessageAt: r.last_message_at ? new Date(String(r.last_message_at)) : new Date(),
        unreadCount: 0,
        status: String(r.status ?? "open"),
        assignedTo: r.assigned_agent_id ? "Asignado" : null,
        slaViolated: false,
        mode: "human",
      }),
    );
    return ok(items);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}