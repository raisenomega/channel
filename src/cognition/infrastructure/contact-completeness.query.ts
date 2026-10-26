/**
 * HUB by Raisen — LEY ABSOLUTA DE DATOS: datos base innegociables (nombre, telefono, direccion, email,
 * detalle del producto/servicio). Ni el sistema ni el agente avanzan a cotizacion si falta ALGUNO. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function datosBaseCompletos(contactId: string): Promise<boolean> {
  const { data } = await supabase.from("contacts")
    .select("display_name, primary_phone, primary_email, address, product_interest")
    .eq("id", contactId).maybeSingle();
  if (!data) return false;
  const c = data as Record<string, string | null>;
  return Boolean(c.display_name && c.primary_phone && c.primary_email && c.address && c.product_interest);
}
