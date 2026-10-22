/**
 * HUB by Raisen — Pestana "Cotizacion" del panel de canal: boton Crear cotizacion para el contacto
 * del hilo (abre F2a) + la lista de sus cotizaciones. Aqui es donde el usuario crea. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CardGrid } from "./tab-card-grid";
import { ContactQuoteCreate } from "@/routes/conversation/contact-quote-create";

export function ChannelQuoteTab({ lang, accent, contactId, contactName, cards }: {
  lang: Idioma; accent: string; contactId: string; contactName: string;
  cards: Parameters<typeof CardGrid>[0]["cards"];
}) {
  return (
    <div className="space-y-3">
      <ContactQuoteCreate lang={lang} accent={accent} contactId={contactId} contactName={contactName} />
      {cards.length > 0 && <CardGrid title={t(lang, "cf.cotizacion")} empty={t(lang, "quotes.empty")} accent={accent} cards={cards} />}
    </div>
  );
}
