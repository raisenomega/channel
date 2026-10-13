/**
 * HUB by Raisen — Datos del contacto (CRM 360) reales del tenant via RLS.
 * Consulta contacts + conversaciones + cotizaciones + ordenes + pagos (PRD CRM).
 */
import { Result, err, ok } from "@shared/domain/result.ts";
import { auth } from "./auth-client.ts";

export type Contact360 = {
  readonly contactId: string;
  readonly displayName: string;
  readonly primaryPhone: string | null;
  readonly primaryEmail: string | null;
  readonly segment: string | null;
  readonly ltvUsd: number;
  readonly totalOrders: number;
  readonly preferredChannel: string | null;
  readonly marketingOptIn: boolean;
  readonly doNotContact: boolean;
  readonly conversaciones: readonly { id: string; channel: string; status: string; lastMessageAt: Date }[];
  readonly cotizaciones: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: Date }[];
  readonly ordenes: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: Date }[];
  readonly pagos: readonly { id: string; status: string; amount: number; currency: string; createdAt: Date }[];
};

export type ContactError =
  | { readonly kind: "sin_sesion" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "no_encontrado" }
  | { readonly kind: "red"; readonly cause: string };

type HubCfg = { supabaseUrl: string; anonKey: string };

function cfg(): HubCfg {
  const g = globalThis as Record<string, unknown>;
  const c = g.__HUB_CONFIG__ as HubCfg | undefined;
  return { supabaseUrl: c?.supabaseUrl ?? "", anonKey: c?.anonKey ?? "" };
}

function authHeader(anonKey: string, token: string): Record<string, string> {
  return { apikey: anonKey, authorization: `Bearer ${token}`, accept: "application/json" };
}

async function getFilas(url: string, anonKey: string, token: string): Promise<Result<Array<Record<string, unknown>>, ContactError>> {
  try {
    const res = await fetch(url, { headers: authHeader(anonKey, token) });
    if (res.status === 401 || res.status === 403) return err({ kind: "no_autorizado" });
    if (!res.ok) return err({ kind: "red", cause: `status ${res.status}` });
    return ok((await res.json()) as Array<Record<string, unknown>>);
  } catch (e) {
    return err({ kind: "red", cause: String(e) });
  }
}

const enc = encodeURIComponent;

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

function num(v: unknown): number {
  return Number(v ?? 0);
}
function str(v: unknown): string {
  return String(v ?? "");
}

function mapaConv(r: Record<string, unknown>): Contact360["conversaciones"][number] {
  return Object.freeze({
    id: str(r.id), channel: str(r.primary_channel), status: str(r.status),
    lastMessageAt: r.last_message_at ? new Date(str(r.last_message_at)) : new Date(),
  });
}
function mapaCompra(r: Record<string, unknown>): Contact360["cotizaciones"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), totalAmount: num(r.total_amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}
function mapaOrden(r: Record<string, unknown>): Contact360["ordenes"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), totalAmount: num(r.total_amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}
function mapaPago(r: Record<string, unknown>): Contact360["pagos"][number] {
  return Object.freeze({ id: str(r.id), status: str(r.status), amount: num(r.amount), currency: str(r.currency), createdAt: r.created_at ? new Date(str(r.created_at)) : new Date() });
}