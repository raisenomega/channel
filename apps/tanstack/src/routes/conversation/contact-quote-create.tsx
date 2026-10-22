/**
 * HUB by Raisen — Boton "Crear cotizacion" dentro de la ficha 360 (seccion Cotizaciones de la
 * conversacion): abre el editor F2a para ESTE contacto; Preview abre el PDF real. La cotizacion
 * guardada aterriza en la pagina de Cotizaciones. C4 <=75.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuoteListItem } from "@/lib/quotes-client";
import { QuoteEditorModal } from "../quotes/quote-editor-modal";
import { QuotePdfModal } from "../quotes/pdf/quote-pdf-modal";

export function ContactQuoteCreate({ lang, contactId, contactName }: {
  lang: Idioma; contactId: string; contactName: string;
}) {
  const [show, setShow] = useState(false);
  const [pdf, setPdf] = useState<QuoteListItem | null>(null);
  const onSaved = (id: string, preview: boolean, cid: string, currency: string, total: number) => {
    setShow(false);
    if (preview) setPdf({ id, contactId: cid, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null });
  };
  return (
    <>
      <Button variant="outline" size="sm" className="mb-1 w-full" onClick={() => setShow(true)}>+ {t(lang, "quotes.create")}</Button>
      {show && <QuoteEditorModal lang={lang} contactId={contactId} contactName={contactName} onClose={() => setShow(false)} onSaved={onSaved} />}
      {pdf && <QuotePdfModal lang={lang} quote={pdf} contactName={contactName} onClose={() => setPdf(null)} />}
    </>
  );
}
