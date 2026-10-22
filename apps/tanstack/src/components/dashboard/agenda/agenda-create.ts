/**
 * HUB by Raisen — Crear una cita (POST directo a Supabase, RLS WITH CHECK tenant_id=current_tenant()).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface NewAppt {
  tenant_id: string;
  title: string;
  scheduled_at: string;
  status: string;
  channel: string | null;
  created_by_type: string;
  contact_id: string | null;
  conversation_id: string | null;
  agent_id: string | null;
  description: string | null;
}

export async function createAppointment(body: NewAppt): Promise<{ ok: boolean; error?: string }> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: "config_incompleta" };
  try {
    const res = await fetch(`${base}/appointments`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    return res.ok ? { ok: true } : { ok: false, error: `supabase ${res.status}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
