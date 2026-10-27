/**
 * HUB by Raisen — LEY ABSOLUTA DE DATOS: los 4 datos innegociables del cliente (nombre, telefono, email,
 * direccion). Ni el sistema ni el agente avanzan a cotizacion si falta ALGUNO. El producto/servicio se infiere
 * del HILO al cotizar (worth gate del producer), NO bloquea aqui -> "si tiene los 4 datos, dispara". C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function datosBaseCompletos(contactId: string): Promise<boolean> {
  const { data } = await supabase.from("contacts")
    .select("display_name, primary_phone, primary_email, address")
    .eq("id", contactId).maybeSingle();
  if (!data) return false;
  const c = data as Record<string, string | null>;
  return Boolean(c.display_name && c.primary_phone && c.primary_email && c.address); // 4 datos; email innegociable
}
