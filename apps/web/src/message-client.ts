/**
 * HUB by Raisen — Datos de mensajes reales desde Supabase (tabla messages)
 * Consulta mensajes por conversation_id con JWT del usuario; RLS filtra por tenant.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import type { Mensaje } from "./chat-thread-helpers.ts";
import { auth } from "./auth-client.ts";
import { cfg, enc, type MensajeError } from "./message-client-helpers.ts";

const COLS = [
  "id", "conversation_id", "sender_type", "sender_id",
  "content", "message_type", "created_at",
];

function desdeFila(r: Record<string, unknown>): Mensaje {
  return {
    id: String(r.id),
    conversationId: String(r.conversation_id),
    senderType: String(r.sender_type) as Mensaje["senderType"],
    senderId: r.sender_id ? String(r.sender_id) : null,
    content: String(r.content),
    messageType: String(r.message_type ?? "text"),
    createdAt: r.created_at ? new Date(String(r.created_at)) : new Date(),
  };
}

export async function cargarMensajes(
  conversationId: string,
): Promise<Result<readonly Mensaje[], MensajeError>> {
  const sesion = auth.leer();
  const { supabaseUrl, anonKey } = cfg();
  if (!sesion) return err({ kind: "sin_sesion" });
  if (!supabaseUrl || !anonKey) return err({ kind: "red", cause: "config_incompleta" });

  const url = `${supabaseUrl}/rest/v1/messages?select=${COLS.join(",")}` +
    `&conversation_id=eq.${enc(conversationId)}&order=created_at.asc&limit=200`;

  try {
    const res = await fetch(url, {
      headers: { apikey: anonKey, authorization: `Bearer ${sesion.accessToken}`, accept: "application/json" },
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    const filas = (await res.json()) as Array<Record<string, unknown>>;
    return ok(filas.map(desdeFila));
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

export async function enviarMensaje(
  conversationId: string,
  content: string,
  senderId: string,
): Promise<Result<Mensaje, MensajeError>> {
  const sesion = auth.leer();
  const { supabaseUrl, anonKey, devChannelEnabled } = cfg();
  if (!sesion) return err({ kind: "sin_sesion" });
  if (!supabaseUrl || !anonKey) return err({ kind: "red", cause: "config_incompleta" });

  // Conectado al dev-channel: persiste en la misma tabla `messages` que DevChannelAdapter.
  const provider = devChannelEnabled ? "dev" : "";

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: anonKey, authorization: `Bearer ${sesion.accessToken}`,
        "content-type": "application/json", accept: "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        conversation_id: conversationId, sender_type: "agent",
        sender_id: senderId, content, message_type: "text",
        ...(provider ? { provider } : {}),
      }),
    });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    return ok(desdeFila((await res.json()) as Record<string, unknown>));
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}