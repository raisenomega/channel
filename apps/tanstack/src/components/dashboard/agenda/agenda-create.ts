/**
 * HUB by Raisen — Crear / editar una cita (POST/PATCH directo a Supabase, RLS por tenant).
 * Videollamada -> autogenera link Jitsi. Creador humano -> captura uid + email de la sesion.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { readLocalSession } from "@/lib/auth";
import type { MediaItem } from "./agenda-types";

export interface ApptPayload {
  title: string; scheduled_at: string; status: string; channel: string | null; created_by_type: string;
  contact_id: string | null; conversation_id: string | null; agent_id: string | null;
  quote_id: string | null; order_id: string | null; attachment_id: string | null;
  description: string | null; reason: string | null; pre_notes: string | null;
  meeting_type: string; meeting_url: string | null; reminders: number[]; media: MediaItem[];
}
type Res = { ok: boolean; error?: string };

function jitsi(): string { return `https://meet.jit.si/HUB-${crypto.randomUUID()}`; }

function baseFields(p: ApptPayload): Record<string, unknown> {
  const url = p.meeting_type === "video" && !p.meeting_url ? jitsi() : (p.meeting_url || null);
  return { ...p, meeting_url: url };
}

async function send(url: string, method: string, body: Record<string, unknown>): Promise<Res> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: "config_incompleta" };
  try {
    const res = await fetch(`${base}/${url}`, { method, headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" }, body: JSON.stringify(body) });
    return res.ok ? { ok: true } : { ok: false, error: `supabase ${res.status}` };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export function createAppointment(tenantId: string, p: ApptPayload): Promise<Res> {
  const s = readLocalSession();
  const human = p.created_by_type === "human";
  const body = {
    tenant_id: tenantId, ...baseFields(p),
    created_by_user_id: human ? (s?.user?.id ?? null) : null,
    created_by_name: human ? (s?.user?.email ?? null) : null,
  };
  return send("appointments", "POST", body);
}

export function updateAppointment(id: string, p: ApptPayload): Promise<Res> {
  return send(`appointments?id=eq.${encodeURIComponent(id)}`, "PATCH", baseFields(p));
}
