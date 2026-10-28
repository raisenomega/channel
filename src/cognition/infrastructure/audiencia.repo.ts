/**
 * HUB by Raisen — Resolver de AUDIENCIA para el broadcast delegado por Victor (read-only, service-role).
 * alcance: "segmento:NOMBRE" | "ultimo_mes"/recencia (creados <=30 dias) | "todos". SIEMPRE excluye
 * do_not_contact y exige telefono. Tope `cap` con conteo total para reportar overflow (sin truncar en
 * silencio). NO envia nada: solo devuelve a quien generarle un borrador. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface Destinatario { contactId: string; phone: string; name: string }
export interface Audiencia { contacts: Destinatario[]; total: number }

export async function resolverAudiencia(tenantId: string, alcance: string, cap: number): Promise<Audiencia> {
  try {
    let q = supabase.from("contacts").select("id,display_name,primary_phone,segment,created_at", { count: "exact" })
      .eq("tenant_id", tenantId).neq("do_not_contact", true).not("primary_phone", "is", null);
    const a = alcance.toLowerCase();
    if (a.startsWith("segmento:")) q = q.eq("segment", a.slice(9).trim());
    else if (a.includes("mes") || a.includes("ultimo") || a.includes("recien")) {
      const d = new Date(); d.setDate(d.getDate() - 30); q = q.gte("created_at", d.toISOString());
    }
    const { data, count } = await q.limit(cap);
    const contacts = (data ?? []).map((r: Record<string, unknown>) => ({
      contactId: String(r.id ?? ""), phone: String(r.primary_phone ?? ""), name: String(r.display_name ?? ""),
    })).filter((c) => c.contactId && c.phone);
    return { contacts, total: count ?? contacts.length };
  } catch {
    return { contacts: [], total: 0 };
  }
}
