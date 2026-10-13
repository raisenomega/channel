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
    const cols = ["id", "contact_id", "status", "operation_mode", "primary_channel", "last_message_at", "assigned_agent_id", "sla_violated", "total_messages", "subject"];
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
        contactId: r.contact_id ? String(r.contact_id) : null,
        contactName: nombreContacto(r.contact_id),
        channel: String(r.primary_channel ?? "whatsapp"),
        lastMessage: String(r.subject ?? "Conversacion"),
        lastMessageAt: r.last_message_at ? new Date(String(r.last_message_at)) : new Date(),
        unreadCount: 0,
        status: String(r.status ?? "open"),
        assignedTo: r.assigned_agent_id ? "Asignado" : null,
        slaViolated: r.sla_violated === true,
        mode: modoReal(r.operation_mode),
      }),
    );
    return ok(items);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

// Sin datos inventados (N5): si no hay display_name real, muestra una etiqueta honesta.
function nombreContacto(contactId: unknown): string {
  const id = contactId ? String(contactId) : "";
  return id.length > 8 ? "Contacto" : id;
}

// Mapea el modo real de la conversacion al tipo InboxItem (valores validos del schema).
function modoReal(m: unknown): InboxItem["mode"] {
  const v = String(m ?? "human");
  if (v === "assistant" || v === "copilot" || v === "autonomous" || v === "escalated" || v === "human") return v;
  return "human";
}