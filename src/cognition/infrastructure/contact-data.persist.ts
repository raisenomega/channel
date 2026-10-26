/**
 * HUB by Raisen — Parte B: guarda los datos capturados en el contacto. Los DUROS (lo que el cliente DIJO
 * explicito, via regex sobre sus mensajes) PISAN el valor viejo/del negocio; los BLANDOS (LLM) solo llenan lo
 * que sigue vacio (cero corrupcion). El guard `completos` evita re-escribir en contactos ya completos. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import type { ExtractedData, DatosDuros } from "../domain/contact-data.ts";

interface Row { display_name?: string | null; primary_phone?: string | null; primary_email?: string | null; address?: string | null; product_interest?: string | null; }

export async function guardarDatosContacto(contactId: string, d: ExtractedData, duros: DatosDuros = {}): Promise<string[]> {
  const { data } = await supabase.from("contacts").select("display_name, primary_phone, primary_email, address, product_interest").eq("id", contactId).maybeSingle();
  if (!data) return [];
  const c = data as Row;
  const patch: Record<string, string> = {};
  if (duros.name) patch["display_name"] = duros.name;       // el cliente DIJO su nombre -> manda
  if (duros.phone) patch["primary_phone"] = duros.phone;    // pisa el telefono viejo/del negocio con el del cliente
  if (duros.email) patch["primary_email"] = duros.email;
  if (duros.address) patch["address"] = duros.address;      // direccion real dada por el cliente -> manda
  if (d.name && !c.display_name && !patch["display_name"]) patch["display_name"] = d.name;       // blando: solo si vacio
  if (d.phone && !c.primary_phone && !patch["primary_phone"]) patch["primary_phone"] = d.phone;
  if (d.email && !c.primary_email && !patch["primary_email"]) patch["primary_email"] = d.email;
  if (d.address && !c.address && !patch["address"]) patch["address"] = d.address;
  if (d.product && d.product.length > (c.product_interest?.length ?? 0)) patch["product_interest"] = d.product; // enriquece
  const keys = Object.keys(patch);
  if (keys.length === 0) return [];
  patch["updated_at"] = new Date().toISOString();
  await supabase.from("contacts").update(patch).eq("id", contactId);
  return keys;
}
