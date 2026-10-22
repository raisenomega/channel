/**
 * HUB by Raisen — Boton "Nueva cotizacion" (estilo/posicion del boton Cita Nueva de Agenda): SIEMPRE
 * visible. Si hay hilo, la cotizacion va a ese contacto; si no (cliente nuevo), el modal deja elegir
 * contacto. Preview abre el PDF real. La cotizacion aterriza en la pagina de Cotizaciones. C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { listarContactos } from "@/lib/contacts-client";
import type { QuoteListItem } from "@/lib/quotes-client";
import { QuoteEditorModal } from "../quotes/quote-editor-modal";
import { QuotePdfModal } from "../quotes/pdf/quote-pdf-modal";

export function ContactQuoteCreate({ lang, accent, contactId, contactName }: {
  lang: Idioma; accent: string; contactId: string; contactName: string;
}) {
  const [show, setShow] = useState(false);
  const [pdf, setPdf] = useState<QuoteListItem | null>(null);
  const cq = useQuery({ queryKey: ["contacts"], staleTime: 60_000, queryFn: async () => { const r = await listarContactos(); return r.ok ? r.value : []; } });
  const contacts = cq.data ?? [];
  const nameFor = (id: string): string => (id === contactId ? contactName : contacts.find((c) => c.id === id)?.displayName ?? "");
  const onSaved = (id: string, preview: boolean, cid: string, currency: string, total: number) => {
    setShow(false);
    if (preview) setPdf({ id, contactId: cid, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null, respondedAt: null });
  };
  return (
    <>
      <button type="button" className="chip font-semibold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }} onClick={() => setShow(true)}>+ {t(lang, "quotes.newQuote")}</button>
      {show && <QuoteEditorModal lang={lang} contactId={contactId} contactName={contactName} contacts={contacts} onClose={() => setShow(false)} onSaved={onSaved} />}
      {pdf && <QuotePdfModal lang={lang} quote={pdf} contactName={nameFor(pdf.contactId ?? "")} onClose={() => setPdf(null)} />}
    </>
  );
}
