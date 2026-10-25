/**
 * HUB by Raisen — B8: actividad del agente + notas + temperatura de un contacto, y acciones de guardar
 * (notas / cascada) via RPC Supabase. El API HUB da la actividad; los RPC guardan.
 */
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface ContactActivityItem {
  id: string; createdAt: string; status: string; scope: string | null;
  draftContent: string; reason: string; confidence: number; conclusion: string | null;
}
export interface ContactNote { text: string; at: string; by?: string }
export interface ContactDetail { activity: ContactActivityItem[]; notes: ContactNote[]; temperature: string | null }

export async function fetchContactDetail(contactId: string): Promise<ContactDetail> {
  const tid = resolveTenantId();
  if (!tid) return { activity: [], notes: [], temperature: null };
  try {
    const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/contacts/${encodeURIComponent(contactId)}/activity`);
    if (!r.ok) return { activity: [], notes: [], temperature: null };
    const j = (await r.json()) as Partial<ContactDetail>;
    return { activity: j.activity ?? [], notes: (j.notes as ContactNote[]) ?? [], temperature: j.temperature ?? null };
  } catch {
    return { activity: [], notes: [], temperature: null };
  }
}

async function rpc(fn: string, body: Record<string, unknown>): Promise<boolean> {
  const base = supabaseRestBase(); const headers = supabaseAuthHeaders();
  if (!base || !headers) return false;
  try { const r = await fetch(`${base}/rpc/${fn}`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) }); return r.ok; } catch { return false; }
}

export const agregarNota = (contactId: string, note: string): Promise<boolean> => rpc("add_contact_note", { p_contact_id: contactId, p_note: note });
export const setTemperatura = (contactId: string, temp: string): Promise<boolean> => rpc("set_contact_temperature", { p_contact_id: contactId, p_temp: temp });
export const eliminarNota = (contactId: string, index: number): Promise<boolean> => rpc("delete_contact_note", { p_contact_id: contactId, p_index: index });
