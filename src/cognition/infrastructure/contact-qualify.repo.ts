/**
 * HUB by Raisen — CRM auto-calificacion: lee el contacto (segment + total_orders), aplica la escalera y, si
 * SUBE de nivel, lo escribe. Devuelve el nuevo nivel (para loguear) o null si no cambia. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { calificarSegmento } from "../domain/contact-qualify.ts";

export async function calificarContacto(contactId: string, opportunity: boolean): Promise<string | null> {
  const { data } = await supabase.from("contacts").select("segment, total_orders").eq("id", contactId).maybeSingle();
  if (!data) return null;
  const r = data as { segment?: string | null; total_orders?: number | null };
  const nuevo = calificarSegmento(r.segment ?? null, { opportunity, totalOrders: r.total_orders ?? 0 });
  if (!nuevo) return null;
  await supabase.from("contacts").update({ segment: nuevo, updated_at: new Date().toISOString() }).eq("id", contactId);
  return nuevo;
}
