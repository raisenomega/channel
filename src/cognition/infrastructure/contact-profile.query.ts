/**
 * HUB by Raisen — B4: perfil corto del contacto (nombre + segmento CRM + ordenes previas) para que el agente
 * personalice (nuevo=bienvenida, recurrente=reconoce, VIP=prioritario). Lee contacts.segment. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const SEG: Record<string, string> = {
  new_lead: "nuevo (primer contacto)", prospect: "prospecto", customer: "cliente", recurring: "recurrente",
  vip: "VIP (alto valor)", at_risk: "en riesgo", churned: "inactivo", blocked: "bloqueado",
};

export async function perfilContacto(contactId: string): Promise<string | null> {
  const { data } = await supabase.from("contacts").select("display_name, segment, total_orders").eq("id", contactId).maybeSingle();
  if (!data) return null;
  const r = data as { display_name?: string | null; segment?: string | null; total_orders?: number | null };
  const partes: string[] = [];
  if (r.display_name) partes.push(r.display_name);
  if (r.segment) partes.push(SEG[r.segment] ?? r.segment);
  if (r.total_orders && r.total_orders > 0) partes.push(`${r.total_orders} ordenes previas`);
  return partes.length ? partes.join(" | ") : null;
}
