/**
 * HUB by Raisen — Resolve la ficha 360 a partir del id de conversación.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Contact360 } from "@/lib/types";
import { fetchContactRaw } from "./conversation-contact-data";
import { mapToContact360 } from "./contact-mapper";
import { enc } from "./conversation-format";

export async function resolveContact360(conversationId: string): Promise<Contact360 | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const url = `${base}/conversations?id=eq.${enc(conversationId)}&select=${enc(["id", "contact_id"].join(","))}&limit=1`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ contact_id: string | null }>;
  const cid = rows[0]?.contact_id;
  if (!cid) return null;
  const raw = await fetchContactRaw(String(cid));
  return raw ? mapToContact360(raw) : null;
}