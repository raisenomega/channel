/**
 * HUB by Raisen — Fetcher de los mensajes del hilo del inbox.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Mensaje } from "@/lib/types";
import { enc } from "./conversation-format";

const MESSAGE_COLS = ["id", "conversation_id", "sender_type", "sender_user_id", "content", "content_type", "created_at"];

export async function fetchMessages(conversationId: string): Promise<Mensaje[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=${enc(MESSAGE_COLS.join(","))}` +
    `&conversation_id=eq.${enc(conversationId)}&order=created_at.asc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as Array<{
      id: string; conversation_id: string; sender_type: string;
      sender_user_id: string | null; content: string; content_type: string; created_at: string;
    }>;
    return filas.map((r) => ({
      id: String(r.id),
      conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_user_id ? String(r.sender_user_id) : null,
      content: String(r.content),
      messageType: String(r.content_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch { return []; }
}