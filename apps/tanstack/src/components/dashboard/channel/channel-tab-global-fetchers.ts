/**
 * HUB by Raisen — Fetchers REST para pestañas globales de negocio.
 * Agentes, plantillas y documentos (no scoped a un contacto).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

const AGENT_COLS = ["id", "display_name", "role", "status"];
const TEMPLATE_COLS = ["id", "name", "channel", "category", "body_preview"];
const DOC_COLS = ["id", "conversation_id", "file_name", "file_type", "file_size", "created_at"];

function enc(v: string): string { return encodeURIComponent(v); }

export async function fetchAgents() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/agents?select=${enc(AGENT_COLS.join(","))}&order=display_name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; display_name: string | null; role: string | null; status: string | null }>;
  } catch { return []; }
}

export async function fetchTemplates() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/templates?select=${enc(TEMPLATE_COLS.join(","))}&order=name.asc`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; name: string | null; channel: string | null; category: string | null; body_preview: string | null }>;
  } catch { return []; }
}

export async function fetchDocuments() {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/attachments?select=${enc(DOC_COLS.join(","))}&order=created_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{ id: string; conversation_id: string | null; file_name: string | null; file_type: string | null; file_size: number | null; created_at: string | null }>;
  } catch { return []; }
}