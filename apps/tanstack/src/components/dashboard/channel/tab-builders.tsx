/**
 * HUB by Raisen — Constructores de datos para SimpleListView/CardGrid.
 * Convierten los registros de las pestañas de negocio en items renderizables.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { RowQuote, RowOrder, RowPayment } from "@/lib/types";
import type { SimpleItem } from "./tab-simple-list";
import type { GridCardData } from "./tab-card-grid";
import { QUOTE_STATUS_TONE, ORDER_STATUS_TONE, PAYMENT_STATUS_TONE } from "./tab-tones";

export function agentsToItems(agents: readonly { id: string; display_name: string | null; role: string | null; status: string | null }[]): SimpleItem[] {
  return agents.map((a) => ({
    id: a.id, name: a.display_name ?? "—", secondary: a.role ?? "",
    right: <span style={{ fontSize: 11, color: a.status === "online" ? "#22c55e" : "var(--muted-foreground)", float: "right" }}>{a.status ?? ""}</span>,
  }));
}

export function templatesToItems(templates: readonly { id: string; name: string | null; category: string | null }[]): SimpleItem[] {
  return templates.map((tl) => ({ id: tl.id, name: tl.name ?? "—", secondary: tl.category ?? "" }));
}

export function docsToItems(docs: readonly { id: string; file_name: string | null; file_type: string | null; file_size: number | null }[]): SimpleItem[] {
  return docs.map((d) => ({
    id: d.id, name: d.file_name ?? "—", secondary: d.file_type ?? "",
    trailing: d.file_size != null ? `${(d.file_size / 1024).toFixed(0)} KB` : undefined,
  }));
}

export function quotesToCards(quotes: readonly RowQuote[], lang: Idioma): GridCardData[] {
  return quotes.map((q) => ({
    id: q.id, title: `${t(lang, "quotes.total")}: ${q.currency} ${q.total_amount.toFixed(2)}`,
    badge: t(lang, "quotes.status." + q.status), tone: QUOTE_STATUS_TONE[q.status] ?? "warn",
    rows: [{ label: t(lang, "quotes.date"), value: new Date(q.created_at).toLocaleDateString() }],
  }));
}

export function ordersToCards(orders: readonly RowOrder[], lang: Idioma): GridCardData[] {
  return orders.map((o) => ({
    id: o.id, title: `${t(lang, "orders.total")}: ${o.currency} ${o.total_amount.toFixed(2)}`,
    badge: t(lang, "orders.status." + o.status), tone: ORDER_STATUS_TONE[o.status] ?? "warn",
    rows: [
      { label: t(lang, "orders.quote"), value: o.quote_id ? o.quote_id.slice(0, 8) + "..." : "—" },
      { label: t(lang, "orders.date"), value: new Date(o.created_at).toLocaleDateString() },
    ],
  }));
}

export function paymentsToCards(payments: readonly RowPayment[], lang: Idioma): GridCardData[] {
  return payments.map((p) => ({
    id: p.id, title: `${p.currency} ${p.amount.toFixed(2)}`,
    badge: t(lang, "payments.status." + p.status), tone: PAYMENT_STATUS_TONE[p.status] ?? "warn",
    rows: [
      { label: t(lang, "payments.provider"), value: p.provider ?? "—" },
      { label: t(lang, "payments.order"), value: p.order_id ? p.order_id.slice(0, 8) + "..." : "—" },
      { label: t(lang, "payments.date"), value: new Date(p.created_at).toLocaleDateString() },
    ],
  }));
}