/**
 * HUB by Raisen — CRM auto-calificacion: lee el contacto (segment + total_orders + temperature), aplica las
 * escaleras (valor + temperatura) y, si SUBE alguna, lo escribe. Devuelve el nuevo nivel/temp (log) o null.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { calificarSegmento, calificarTemperatura } from "../domain/contact-qualify.ts";

export async function calificarContacto(contactId: string, opportunity: boolean): Promise<string | null> {
  const { data } = await supabase.from("contacts").select("segment, total_orders, temperature").eq("id", contactId).maybeSingle();
  if (!data) return null;
  const r = data as { segment?: string | null; total_orders?: number | null; temperature?: string | null };
  const sig = { opportunity, totalOrders: r.total_orders ?? 0 };
  const seg = calificarSegmento(r.segment ?? null, sig);
  const temp = calificarTemperatura(r.temperature ?? null, sig);
  const patch: Record<string, string> = {};
  if (seg) patch["segment"] = seg;
  if (temp) patch["temperature"] = temp;
  if (Object.keys(patch).length === 0) return null;
  patch["updated_at"] = new Date().toISOString();
  await supabase.from("contacts").update(patch).eq("id", contactId);
  return seg ?? temp;
}
