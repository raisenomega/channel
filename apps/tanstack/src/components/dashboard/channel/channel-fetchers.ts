/**
 * HUB by Raisen — Fetchers REST (Supabase) para el canal y su hilo.
 * Conversaciones, mensajes y contacto del hilo activo.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Mensaje } from "@/lib/types";

// Bug 2 (Hotfix P): columnas REALES = sender_user_id + content_type (el select con sender_id/message_type daba 400 -> []).
const MESSAGE_COLS = ["id", "conversation_id", "sender_type", "sender_user_id", "direction", "content", "content_type", "created_at"];
// Bug 1 (Hotfix P): embed del contacto -> nombre REAL en la lista (no "Cliente <id>").
const CONV_COLS = ["id", "contact_id", "primary_channel", "subject", "last_message_at", "contacts(display_name)"];
const CONTACT_COLS = [
  "id", "display_name", "primary_phone", "primary_email",
  "segment", "ltv_usd", "total_orders", "preferred_channel",
];

function enc(v: string): string { return encodeURIComponent(v); }

export async function fetchChannelConversations(channelId: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/conversations?select=${enc(CONV_COLS.join(","))}` +
    `&primary_channel=eq.${enc(channelId)}&order=last_message_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      id: string; contact_id: string | null; primary_channel: string | null;
      subject: string | null; last_message_at: string | null;
      contacts: { display_name: string | null } | { display_name: string | null }[] | null; // PostgREST puede embeber objeto O array
    }>;
  } catch { return []; }
}

export async function fetchMessagesForConversation(conversationId: string): Promise<Mensaje[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=${enc(MESSAGE_COLS.join(","))}` +
    `&conversation_id=eq.${enc(conversationId)}&order=created_at.asc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as Array<{
      id: string; conversation_id: string; sender_type: string; sender_user_id: string | null;
      direction: string | null; content: string | null; content_type: string | null; created_at: string;
    }>;
    return filas.map((r) => ({
      id: String(r.id), conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_user_id ? String(r.sender_user_id) : null,
      content: String(r.content ?? ""), messageType: String(r.content_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch { return []; }
}

export async function fetchContact(id: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const url = `${base}/contacts?id=eq.${enc(id)}&select=${enc(CONTACT_COLS.join(","))}&limit=1`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const rows = (await res.json()) as unknown as Array<{
      id: string; display_name: string | null; primary_phone: string | null; primary_email: string | null;
      segment: string | null; ltv_usd: number | null; total_orders: number | null; preferred_channel: string | null;
    }>;
    return rows[0] ?? null;
  } catch { return null; }
}

/** Información cargada del contacto del hilo activo (ficha 360). */
export type ActiveContactInfo = NonNullable<Awaited<ReturnType<typeof fetchContact>>>;