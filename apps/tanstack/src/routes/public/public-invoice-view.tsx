/**
 * HUB by Raisen — Vista publica de la factura (sin login): la muestra con el branding del negocio
 * (BusinessDocument, etiqueta FACTURA) + boton Pagar. Pagar = solicita el pago (sin pasarela aun:
 * marca pay_requested; el negocio confirma el dinero real). Espejo de public-quote-view. C4 <=75.
 */
import { useState, type ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { requestPayInvoice, type PublicInvoice } from "@/lib/public-invoice-client";
import { BusinessDocument, type DocLabels } from "@/routes/quotes/pdf/business-document";
import { styleOf } from "@/routes/quotes/pdf/pdf-styles";
import type { BizInfo } from "@/routes/quotes/pdf/pdf-business-info";

const Msg = ({ children }: { children: ReactNode }) => <div className="mx-auto max-w-md p-10 text-center text-sm text-foreground">{children}</div>;

export function PublicInvoiceView({ lang, token, data }: { lang: Idioma; token: string; data: PublicInvoice }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (done) return <Msg>{t(lang, "public.payThanks")}</Msg>;
  if (data.status !== "valid" || !data.invoice || !data.brand) return <Msg>{t(lang, "public." + (["expired", "not_found"].includes(data.status) ? data.status : "error"))}</Msg>;
  const q = data.invoice, b = data.brand;
  const biz: BizInfo = { name: b.name, phone: "", email: "", address: "", logoUrl: b.logo_url, style: b.style, tax: { mode: "pct", value: 0, currency: "USD" }, footer1: "", terms: "" };
  const items = q.items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unit_price), lineTotal: Number(i.line_total) }));
  const totals = { subtotal: Number(q.subtotal), tax: Number(q.tax_total), total: Number(q.total), currency: "USD" };
  const labels: DocLabels = { subtotal: t(lang, "doc.subtotal"), tax: t(lang, "doc.taxTotal"), total: t(lang, "quotes.total"), client: t(lang, "quotes.contact"), terms: t(lang, "quotes.tpl.terms") };
  const headers = [t(lang, "doc.description"), t(lang, "doc.qty"), t(lang, "doc.price"), t(lang, "doc.total")];
  const cli = [q.service, q.client_phone, q.client_email, q.client_address].filter(Boolean) as string[];
  const pay = async () => {
    setBusy(true);
    const r = await requestPayInvoice(token);
    setBusy(false);
    if (r === "ok") setDone(true); else window.alert(t(lang, "public.error"));
  };
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <BusinessDocument title={t(lang, "invoices.pdfTitle")} style={styleOf(b.style)} biz={biz} refId={token.slice(0, 8)} client={{ name: q.client_name, lines: cli }} items={items} totals={totals} headers={headers} labels={labels} />
      {q.pay_requested ? <Msg>{t(lang, "public.payPending")}</Msg> : (
        <button type="button" className="chip w-full bg-green-600 py-2 font-bold text-white" disabled={busy} onClick={() => void pay()}>{t(lang, "public.pay")}</button>
      )}
    </div>
  );
}
