/**
 * HUB by Raisen — Parte B: guarda los datos capturados en el contacto, pero SOLO en los campos que estan
 * VACIOS (nunca pisa un dato ya bueno -> cero corrupcion). Devuelve que campos se llenaron (para log).
 * Los 4 primeros son columnas existentes; product_interest lo agrega la migr 096. Service-role. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { ExtractedData } from "../domain/contact-data.ts";

interface Row { display_name?: string | null; primary_phone?: string | null; primary_email?: string | null; address?: string | null; product_interest?: string | null; }

export async function guardarDatosContacto(contactId: string, d: ExtractedData): Promise<string[]> {
  const { data } = await supabase.from("contacts").select("display_name, primary_phone, primary_email, address, product_interest").eq("id", contactId).maybeSingle();
  if (!data) return [];
  const c = data as Row;
  const patch: Record<string, string> = {};
  if (d.name && !c.display_name) patch["display_name"] = d.name;
  if (d.phone && !c.primary_phone) patch["primary_phone"] = d.phone;
  if (d.email && !c.primary_email) patch["primary_email"] = d.email;
  if (d.address && !c.address) patch["address"] = d.address;
  if (d.product && !c.product_interest) patch["product_interest"] = d.product;
  const keys = Object.keys(patch);
  if (keys.length === 0) return [];
  patch["updated_at"] = new Date().toISOString();
  await supabase.from("contacts").update(patch).eq("id", contactId);
  return keys;
}
