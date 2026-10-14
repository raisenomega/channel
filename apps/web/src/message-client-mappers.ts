/**
 * HUB by Raisen — Mapper de filas de mensajes a entidad Mensaje.
 */
import type { Mensaje } from "./chat-thread-helpers.ts";

export const MSG_COLS = [
  "id", "conversation_id", "sender_type", "sender_id",
  "content", "message_type", "created_at",
];

export function desdeFila(r: Record<string, unknown>): Mensaje {
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