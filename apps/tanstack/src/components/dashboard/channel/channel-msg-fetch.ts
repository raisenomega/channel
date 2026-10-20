/**
 * HUB by Raisen — Bloque 6 (Bug 4): fetch de mensajes del hilo.
 * Página keyset (scroll infinito, los más nuevos antes del cursor) + día específico (filtro del header).
 * Vía Supabase REST; RLS acota al tenant. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Mensaje } from "@/lib/types";

const COLS = "id,conversation_id,sender_type,sender_user_id,direction,content,content_type,created_at";
export const MSG_PAGE = 30;
function enc(v: string): string { return encodeURIComponent(v); }

interface Row { id: string; conversation_id: string; sender_type: string; sender_user_id: string | null; direction: string | null; content: string | null; content_type: string | null; created_at: string; }
function toMensaje(r: Row): Mensaje {
  return {
    id: String(r.id), conversationId: String(r.conversation_id),
    senderType: String(r.sender_type) as Mensaje["senderType"],
    senderId: r.sender_user_id ? String(r.sender_user_id) : null,
    content: String(r.content ?? ""), messageType: String(r.content_type ?? "text"),
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}
async function getRows(query: string): Promise<Mensaje[]> {
  const base = supabaseRestBase(); const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const res = await fetch(`${base}/messages?select=${enc(COLS)}&${query}`, { headers });
    if (!res.ok) return [];
    return ((await res.json()) as Row[]).map(toMensaje);
  } catch { return []; }
}

// Página de scroll infinito: los MSG_PAGE más nuevos ANTES de `cursor` (DESC). cursor = created_at del más viejo cargado.
export async function fetchMessagesPage(conversationId: string, cursor: string | null): Promise<Mensaje[]> {
  let q = `conversation_id=eq.${enc(conversationId)}&order=created_at.desc&limit=${MSG_PAGE}`;
  if (cursor) q += `&created_at=lt.${enc(cursor)}`;
  return getRows(q);
}

// 2o: todos los mensajes (recibidos + enviados) de un día local. day = "YYYY-MM-DD".
export async function fetchMessagesForDay(conversationId: string, day: string): Promise<Mensaje[]> {
  const start = new Date(`${day}T00:00:00`); // medianoche local
  if (Number.isNaN(start.getTime())) return [];
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const q = `conversation_id=eq.${enc(conversationId)}&created_at=gte.${enc(start.toISOString())}` +
    `&created_at=lt.${enc(end.toISOString())}&order=created_at.asc&limit=500`;
  return getRows(q);
}
