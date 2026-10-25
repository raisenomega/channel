/**
 * HUB by Raisen — B4: perfil corto del contacto (nombre + segmento CRM + ordenes previas) para que el agente
 * personalice (nuevo=bienvenida, recurrente=reconoce, VIP=prioritario). Lee contacts.segment. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const SEG: Record<string, string> = {
  general: "general (sin calificar)", nuevo: "nuevo lead (mostro interes)", regular: "cliente recurrente", vip: "VIP (alto valor)",
  new_lead: "nuevo", prospect: "prospecto", customer: "cliente", recurring: "recurrente", at_risk: "en riesgo", churned: "inactivo", blocked: "bloqueado",
};

export async function perfilContacto(contactId: string): Promise<string | null> {
  const { data } = await supabase.from("contacts").select("display_name, segment, total_orders, primary_phone, primary_email, address").eq("id", contactId).maybeSingle();
  if (!data) return null;
  const r = data as { display_name?: string | null; segment?: string | null; total_orders?: number | null; primary_phone?: string | null; primary_email?: string | null; address?: string | null };
  const partes: string[] = [];
  if (r.display_name) partes.push(r.display_name);
  if (r.segment) partes.push(SEG[r.segment] ?? r.segment);
  if (r.total_orders && r.total_orders > 0) partes.push(`${r.total_orders} ordenes previas`);
  const archivo: string[] = [];
  if (r.primary_phone) archivo.push(`tel ${r.primary_phone}`);
  if (r.primary_email) archivo.push(`email ${r.primary_email}`);
  if (r.address) archivo.push(`direccion ${r.address}`);
  if (archivo.length) partes.push(`DATOS EN ARCHIVO (ya los tienes, NO los vuelvas a pedir): ${archivo.join(", ")}`);
  return partes.length ? partes.join(" | ") : null;
}
