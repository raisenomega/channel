/**
 * HUB by Raisen — Fetcher de datos crudos de la ficha 360 del contacto.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { RowContact, RowQuote, RowOrder, RowPayment } from "@/lib/types";
import { enc } from "./conversation-format";

const CONTACT_COLS = ["id", "display_name", "primary_phone", "primary_email", "segment", "ltv_usd", "total_orders", "preferred_channel", "marketing_opt_in", "do_not_contact"];
const ORDER_COLS = ["id", "status", "total_amount", "currency", "created_at"];
const PAYMENT_COLS = ["id", "status", "amount", "currency", "created_at"];

export interface ContactRaw {
  row: RowContact;
  convs: Array<{ id: string; channel: string; status: string; lastMessageAt: string }>;
  quotes: Array<{ id: string; status: string; totalAmount: number; currency: string; createdAt: string }>;
  orders: Array<{ id: string; status: string; totalAmount: number; currency: string; createdAt: string }>;
  payments: Array<{ id: string; status: string; amount: number; currency: string; createdAt: string }>;
}

export async function fetchContactRaw(contactId: string): Promise<ContactRaw | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const contactUrl = `${base}/contacts?id=eq.${enc(contactId)}&select=${enc(CONTACT_COLS.join(","))}&limit=1`;
  try {
    const cr = await fetch(contactUrl, { headers });
    if (!cr.ok) return null;
    const row = (await cr.json() as RowContact[])[0];
    if (!row) return null;
    const convUrl = `${base}/conversations?contact_id=eq.${enc(contactId)}&select=id,primary_channel,status,last_message_at&order=last_message_at.desc&limit=5`;
    const quoteUrl = `${base}/quotes?contact_id=eq.${enc(contactId)}&select=${enc(ORDER_COLS.join(","))}&order=created_at.desc&limit=5`;
    const orderUrl = `${base}/orders?contact_id=eq.${enc(contactId)}&select=${enc(ORDER_COLS.join(","))}&order=created_at.desc&limit=5`;
    const [convR, quoteR, orderR] = await Promise.all([fetch(convUrl, { headers }), fetch(quoteUrl, { headers }), fetch(orderUrl, { headers })]);
    const convs = convR.ok ? (await convR.json() as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id), channel: String(r.primary_channel ?? ""), status: String(r.status ?? ""),
      lastMessageAt: String(r.last_message_at ?? new Date().toISOString()),
    })) : [];
    const quotes = quoteR.ok ? (await quoteR.json() as RowQuote[]).map((q) => ({
      id: String(q.id), status: String(q.status), totalAmount: Number(q.total_amount ?? 0),
      currency: String(q.currency ?? "USD"), createdAt: String(q.created_at ?? new Date().toISOString()),
    })) : [];
    const ordersRaw = orderR.ok ? (await orderR.json() as RowOrder[]) : [];
    const orders = ordersRaw.map((o) => ({
      id: String(o.id), status: String(o.status), totalAmount: Number(o.total_amount ?? 0),
      currency: String(o.currency ?? "USD"), createdAt: String(o.created_at ?? new Date().toISOString()),
    }));
    const orderIds = ordersRaw.slice(0, 5).map((o) => String(o.id)).filter(Boolean);
    let payments: ContactRaw["payments"] = [];
    if (orderIds.length) {
      const payUrl = `${base}/payments?order_id=in.(${orderIds.map(enc).join(",")})&select=${enc(PAYMENT_COLS.join(","))}&order=created_at.desc&limit=10`;
      const payR = await fetch(payUrl, { headers });
      if (payR.ok) {
        payments = (await payR.json() as RowPayment[]).map((p) => ({
          id: String(p.id), status: String(p.status), amount: Number(p.amount ?? 0),
          currency: String(p.currency ?? "USD"), createdAt: String(p.created_at ?? new Date().toISOString()),
        }));
      }
    }
    return { row, convs, quotes, orders, payments };
  } catch { return null; }
}