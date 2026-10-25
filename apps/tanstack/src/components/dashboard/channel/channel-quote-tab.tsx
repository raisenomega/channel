/**
 * HUB by Raisen — Pestana "Cotizacion" del panel de canal: boton Crear cotizacion (fijo arriba) + las
 * propuestas del agente (grid 4/linea, abren el modal real al Aceptar) + la lista de cotizaciones. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useDraftsPending } from "@/hooks/useDraftsPending";
import { CardGrid } from "./tab-card-grid";
import { ContactQuoteCreate } from "@/routes/conversation/contact-quote-create";
import { QuoteProposalsSection } from "./quote-proposals-section";

export function ChannelQuoteTab({ lang, accent, contactId, contactName, cards }: {
  lang: Idioma; accent: string; contactId: string; contactName: string;
  cards: Parameters<typeof CardGrid>[0]["cards"];
}) {
  const { drafts, reload } = useDraftsPending();
  const propuestas = drafts.filter((d) => d.scope === "quote" && d.status !== "rejected" && d.quoteContactId === contactId);
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><ContactQuoteCreate lang={lang} accent={accent} contactId={contactId} contactName={contactName} /></div>
      <QuoteProposalsSection lang={lang} propuestas={propuestas} onChange={reload} />
      {cards.length > 0 && <CardGrid title={t(lang, "cf.cotizacion")} empty={t(lang, "quotes.empty")} accent={accent} cards={cards} />}
    </div>
  );
}
