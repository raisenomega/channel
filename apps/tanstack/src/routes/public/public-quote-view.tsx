/**
 * HUB by Raisen — Vista publica de la cotizacion (sin login): la muestra con el branding del negocio
 * (BusinessDocument) + botones Aceptar / Rechazar. Al responder, muestra gracias. C4 <=75.
 */
import { useState, type ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { respondPublicQuote, type PublicQuote } from "@/lib/public-quote-client";
import { BusinessDocument, type DocLabels } from "@/routes/quotes/pdf/business-document";
import { styleOf } from "@/routes/quotes/pdf/pdf-styles";
import type { BizInfo } from "@/routes/quotes/pdf/pdf-business-info";

const Msg = ({ children }: { children: ReactNode }) => <div className="mx-auto max-w-md p-10 text-center text-sm text-foreground">{children}</div>;

export function PublicQuoteView({ lang, token, data }: { lang: Idioma; token: string; data: PublicQuote }) {
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  if (done) return <Msg>{t(lang, done === "accepted" ? "public.accepted" : "public.rejected")}</Msg>;
  if (data.status !== "valid" || !data.quote || !data.brand) return <Msg>{t(lang, "public." + (["expired", "used", "not_found"].includes(data.status) ? data.status : "error"))}</Msg>;
  const q = data.quote, b = data.brand;
  const biz: BizInfo = { name: b.name, phone: b.phone ?? "", email: b.email ?? "", address: b.address ?? "", logoUrl: b.logo_url, style: b.style, tax: { mode: b.tax?.mode === "fixed" ? "fixed" : "pct", value: Number(b.tax?.value ?? 0), currency: b.tax?.currency ?? "USD" }, footer1: b.footer1 ?? "", terms: b.terms ?? "" };
  const items = q.items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unit_price), lineTotal: Number(i.line_total) }));
  const totals = { subtotal: Number(q.subtotal), tax: Number(q.tax_total), total: Number(q.total), currency: "USD" };
  const labels: DocLabels = { subtotal: t(lang, "doc.subtotal"), tax: t(lang, "doc.taxTotal"), total: t(lang, "quotes.total"), client: t(lang, "quotes.contact"), terms: t(lang, "quotes.tpl.terms") };
  const headers = [t(lang, "doc.description"), t(lang, "doc.qty"), t(lang, "doc.price"), t(lang, "doc.total")];
  const cli = [q.client_phone, q.client_email, q.client_address].filter(Boolean) as string[]; // contacto limpio: el servicio va como linea, no en el bloque CONTACTO
  const respond = async (d: "accepted" | "rejected") => {
    setBusy(true);
    const r = await respondPublicQuote(token, d, note);
    setBusy(false);
    if (r === "ok") setDone(d); else window.alert(t(lang, "public.error"));
  };
  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4">
      <BusinessDocument title={t(lang, "quotes.pdf.title")} style={styleOf(b.style)} biz={biz} refId={q.quote_number || token.slice(0, 8)} client={{ name: q.client_name, lines: cli }} items={items} totals={totals} headers={headers} labels={labels} />
      <textarea className="w-full rounded-xl border border-border/55 bg-card-soft p-2 text-sm text-foreground" rows={2} placeholder={t(lang, "public.note")} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="chip flex-1 bg-green-600 py-2 font-bold text-white" disabled={busy} onClick={() => void respond("accepted")}>{t(lang, "public.accept")}</button>
        <button type="button" className="chip flex-1 bg-red-500 py-2 font-bold text-white" disabled={busy} onClick={() => void respond("rejected")}>{t(lang, "public.reject")}</button>
      </div>
    </div>
  );
}
