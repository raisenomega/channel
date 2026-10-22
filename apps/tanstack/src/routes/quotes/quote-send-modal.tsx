/**
 * HUB by Raisen — Modal "Enviar cotizacion": acuna el link de aprobacion y lo mete en el mensaje por
 * defecto, luego la barra de canales envia el texto (con el link) al hilo del cliente. C4 <=75.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { createApprovalToken, approvalLink } from "@/lib/public-quote-client";
import { DocSendBar } from "./doc-send-bar";

export function QuoteSendModal({ lang, quoteId, contactId, clientName, total, currency, onClose }: {
  lang: Idioma; quoteId: string; contactId: string; clientName: string; total: number; currency: string; onClose: () => void;
}) {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    void createApprovalToken(quoteId).then((tk) => {
      const link = tk ? approvalLink(tk) : "";
      const hola = lang === "es" ? `Hola ${clientName || ""}, tu cotizacion por ${currency} ${total.toFixed(2)}:` : `Hi ${clientName || ""}, your quote for ${currency} ${total.toFixed(2)}:`;
      setMsg(`${hola}\n${link}`);
    });
  }, [quoteId, clientName, total, currency, lang]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="max-h-[92vh] w-full max-w-md overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader><CardTitle>{t(lang, "quotes.sendTitle")}</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {msg ? <DocSendBar lang={lang} contactId={contactId} initialMessage={msg} /> : <p className="text-sm text-muted-foreground">{t(lang, "common.loading")}...</p>}
          <Button variant="ghost" onClick={onClose}>{t(lang, "quotes.cancel")}</Button>
        </CardBody>
      </Card>
    </div>
  );
}
