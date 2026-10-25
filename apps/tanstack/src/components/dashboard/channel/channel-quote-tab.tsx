/**
 * HUB by Raisen — Pestana "Cotizacion" del panel de canal: boton Crear cotizacion para el contacto
 * del hilo (abre F2a) + la lista de sus cotizaciones. Aqui es donde el usuario crea. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CardGrid } from "./tab-card-grid";
import { ContactQuoteCreate } from "@/routes/conversation/contact-quote-create";
import { useDraftsPending } from "@/hooks/useDraftsPending";
import { AgentQuoteProposal } from "./agent-quote-proposal";

export function ChannelQuoteTab({ lang, accent, contactId, contactName, cards }: {
  lang: Idioma; accent: string; contactId: string; contactName: string;
  cards: Parameters<typeof CardGrid>[0]["cards"];
}) {
  const { drafts, reload } = useDraftsPending();
  const propuestas = drafts.filter((d) => d.scope === "quote" && d.quoteContactId === contactId);
  return (
    <div className="space-y-3">
      {propuestas.map((d) => <AgentQuoteProposal key={d.id} lang={lang} draft={d} onDone={reload} />)}
      <div className="flex justify-end"><ContactQuoteCreate lang={lang} accent={accent} contactId={contactId} contactName={contactName} /></div>
      {cards.length > 0 && <CardGrid title={t(lang, "cf.cotizacion")} empty={t(lang, "quotes.empty")} accent={accent} cards={cards} />}
    </div>
  );
}
