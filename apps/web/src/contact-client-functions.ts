/**
 * HUB by Raisen — Carga la ficha 360 del contacto.
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { auth } from "./auth-client.ts";
import type { Contact360, ContactError } from "./contact-client-types.ts";
import { cfg, getFilas, enc } from "./contact-client-helpers.ts";
import { mapaConv, mapaCompra, mapaOrden, mapaPago } from "./contact-client-mappers.ts";

export async function cargarContacto(id: string): Promise<Result<Contact360, ContactError>> {
  const sesion = auth.leer();
  const { supabaseUrl, anonKey } = cfg();
  if (!sesion) return err({ kind: "sin_sesion" });
  if (!supabaseUrl || !anonKey) return err({ kind: "red", cause: "config_incompleta" });
  const token = sesion.accessToken;

  const base = `${supabaseUrl}/rest/v1`;
  const [contactR, convR, qR, oR] = await Promise.all([
    getFilas(`${base}/contacts?id=eq.${enc(id)}&select=id,display_name,primary_phone,primary_email,segment,ltv_usd,total_orders,preferred_channel,marketing_opt_in,do_not_contact&limit=1`, anonKey, token),
    getFilas(`${base}/conversations?contact_id=eq.${enc(id)}&select=id,primary_channel,status,last_message_at&order=last_message_at.desc&limit=5`, anonKey, token),
    getFilas(`${base}/quotes?contact_id=eq.${enc(id)}&select=id,status,total_amount,currency,created_at&order=created_at.desc&limit=5`, anonKey, token),
    getFilas(`${base}/orders?contact_id=eq.${enc(id)}&select=id,status,total_amount,currency,created_at&order=created_at.desc&limit=5`, anonKey, token),
  ]);

  const ordenes = oR.ok ? oR.value : [];
  const orderIds = ordenes.slice(0, 5).map((o) => String(o.id)).filter(Boolean);
  const pR = orderIds.length
    ? await getFilas(`${base}/payments?order_id=in.(${orderIds.map(enc).join(",")})&select=id,status,amount,currency,created_at&order=created_at.desc&limit=10`, anonKey, token)
    : null;

  if (!contactR.ok) return err(contactR.error);
  const row = contactR.value[0];
  if (!row) return err({ kind: "no_encontrado" });

  return ok(Object.freeze({
    contactId: String(row.id),
    displayName: String(row.display_name ?? "Contacto"),
    primaryPhone: row.primary_phone ? String(row.primary_phone) : null,
    primaryEmail: row.primary_email ? String(row.primary_email) : null,
    segment: row.segment ? String(row.segment) : null,
    ltvUsd: Number(row.ltv_usd ?? 0),
    totalOrders: Number(row.total_orders ?? 0),
    preferredChannel: row.preferred_channel ? String(row.preferred_channel) : null,
    marketingOptIn: row.marketing_opt_in === true,
    doNotContact: row.do_not_contact === true,
    conversaciones: (convR.ok ? convR.value : []).map(mapaConv),
    cotizaciones: (qR.ok ? qR.value : []).map(mapaCompra),
    ordenes: ordenes.map(mapaOrden),
    pagos: (pR?.ok ? pR.value : []).map(mapaPago),
  }));
}