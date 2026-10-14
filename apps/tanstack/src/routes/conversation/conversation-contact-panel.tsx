/**
 * HUB by Raisen — Panel de ficha 360 del contacto del hilo.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { Contact360 } from "@/lib/types";
import { currency, dateStr, initial } from "./conversation-format";

export function ContactPanel({ contact, language }: { contact: Contact360 | null | "loading"; language: Idioma }) {
  if (contact === "loading") {
    return <Card title={t(language, "dash.ficha")} body={t(language, "dash.fichaCargando")} />;
  }
  if (!contact) {
    return <Card title={t(language, "dash.ficha")} body={t(language, "dash.fichaSinDatos")} />;
  }

  const c = contact as Contact360;
  const segmentLabel = c.segment ? t(language, "dash.segmento." + c.segment) : "—";
  const ltv = currency(c.ltvUsd, "USD", language);
  const canal = c.preferredChannel ? t(language, "canal." + c.preferredChannel) : "—";
  const consent = c.doNotContact ? t(language, "dash.dnc") : t(language, "dash.ok");

  const fila = (label: string, valor: string) => (
    <div className="feat flex items-center gap-sm" style={{ padding: "7px 0", borderBottom: "1px solid hsl(var(--border) / 0.25)" }}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm ml-auto" style={{ color: valor !== "—" ? "hsl(var(--primary))" : "hsl(var(--text-dim))" }}>{valor}</span>
    </div>
  );
  const sec = (ti: string) => (
    <div className="text-xs font-bold text-muted-foreground uppercase" style={{ letterSpacing: "0.06em", margin: "14px 0 4px" }}>{ti}</div>
  );
  const sinReg = () => <p className="text-sm text-muted-foreground" style={{ margin: "2px 0 6px" }}>{t(language, "dash.sinRegistros")}</p>;

  const cotizaciones = c.cotizaciones.length === 0 ? [sinReg()] : c.cotizaciones.slice(0, 3).map((q) => fila(t(language, "dash.estado." + q.status) + " . " + dateStr(q.createdAt, language), currency(q.totalAmount, q.currency, language)));
  const ordenes = c.ordenes.length === 0 ? [sinReg()] : c.ordenes.slice(0, 3).map((o) => fila(t(language, "dash.estado." + o.status) + " . " + dateStr(o.createdAt, language), currency(o.totalAmount, o.currency, language)));
  const pagos = c.pagos.length === 0 ? [sinReg()] : c.pagos.slice(0, 3).map((p) => fila(t(language, "dash.estado." + p.status), currency(p.amount, p.currency, language)));

  return (
    <div className="rounded-2xl glass-card p-4" data-contact360>
      <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "dash.ficha")}</h3>
      <div className="flex items-center gap-2" style={{ padding: "14px 0" }}>
        <span className="flex size-10 items-center justify-center rounded-full font-bold text-background bg-primary">{initial(c.displayName)}</span>
        <div className="nm flex-1 min-width-0">
          <div className="text-sm font-bold truncate text-foreground">{c.displayName}</div>
          <div className="text-xs text-muted-foreground">{c.primaryEmail ?? c.primaryPhone ?? "—"}</div>
        </div>
      </div>
      {fila(t(language, "dash.telefono"), c.primaryPhone ?? "—")}
      {fila(t(language, "dash.email"), c.primaryEmail ?? "—")}
      {fila(t(language, "dash.segmento"), segmentLabel)}
      {fila(t(language, "dash.pedidos"), String(c.totalOrders))}
      {fila(t(language, "dash.ltv"), ltv)}
      {fila(t(language, "dash.prefCanal"), canal)}
      {fila(t(language, "dash.consent"), consent)}
      {sec(t(language, "dash.seccCotizaciones"))}
      {cotizaciones}
      {sec(t(language, "dash.seccOrdenes"))}
      {ordenes}
      {sec(t(language, "dash.seccPagos"))}
      {pagos}
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl glass-card p-4">
      <h3 className="mb-3 font-display text-base font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}