/**
 * HUB by Raisen — TabContent: orquesta las pestañas de negocio del panel
 * de canal usando vistas compartidas (SimpleListView, CardGrid, ficha).
 * C4 ≤75 líneas.
 */
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import type { ChannelTab } from "@/components/dashboard/channel-frame";
import { ChatAmplified } from "@/components/dashboard/channel-frame";
import { fetchAgents, fetchTemplates, fetchDocuments } from "./channel-tab-global-fetchers";
import { fetchQuotesForContact, fetchOrdersForContact, fetchPaymentsForContact } from "./channel-tab-contact-fetchers";
import { SimpleListView } from "./tab-simple-list";
import { CardGrid } from "./tab-card-grid";
import { ContactFichaCard } from "./tab-contact-ficha";
import { templatesToItems, docsToItems, quotesToCards, paymentsToCards } from "./tab-builders";
import type { ActiveContactInfo } from "./channel-fetchers";
import { AgendaCalendar } from "@/components/dashboard/agenda/agenda-calendar";
import { ChannelQuoteTab } from "./channel-quote-tab";
import { ChannelInvoiceTab } from "./channel-invoice-tab";
import { ChannelSkuTab } from "./channel-sku-tab"; import { ChannelConfigTab } from "./channel-config-tab";
import { AgentNavigator } from "@/components/dashboard/agents/agent-navigator";

function useTabData(contactId: string | null) {
  const agents = useQuery({ queryKey: ["channel-agents"], queryFn: fetchAgents, staleTime: 30_000 });
  const templates = useQuery({ queryKey: ["channel-templates"], queryFn: fetchTemplates, staleTime: 30_000 });
  const documents = useQuery({ queryKey: ["channel-documents"], queryFn: fetchDocuments, staleTime: 30_000 });
  const quotes = useQuery({ queryKey: ["channel-quotes-contact", contactId], queryFn: () => fetchQuotesForContact(contactId as string), enabled: !!contactId, staleTime: 30_000 });
  const orders = useQuery({ queryKey: ["channel-orders-contact", contactId], queryFn: () => fetchOrdersForContact(contactId as string), enabled: !!contactId, staleTime: 30_000 });
  const payments = useQuery({ queryKey: ["channel-payments-contact", contactId], queryFn: () => fetchPaymentsForContact(contactId as string), enabled: !!contactId, staleTime: 30_000 });
  return { agents: agents.data ?? [], templates: templates.data ?? [], documents: documents.data ?? [], quotes: quotes.data ?? [], orders: orders.data ?? [], payments: payments.data ?? [] };
}

export function TabContent({ lang, activeTab, accent, contactId, contactInfo }: {
  lang: Idioma;
  activeTab: ChannelTab | undefined;
  accent: string;
  contactId: string | null;
  contactInfo: ActiveContactInfo | null;
}): ReactNode {
  const data = useTabData(contactId);
  if (!activeTab) return <ChatAmplified lang={lang} />;
  const hasHilo = !!contactId;
  const sinHilo = <Card><CardBody className="py-8 text-center"><p className="text-sm text-muted-foreground">{t(lang, "canal.sinHilo")}</p></CardBody></Card>;
  const empty = t(lang, "dash.sinRegistros");

  switch (activeTab) {
    case "agentes": return <AgentNavigator lang={lang} />;
    case "contactos":
      if (!hasHilo || !contactInfo) return sinHilo;
      return (
        <div className="space-y-3">
          <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})` }}>{t(lang, "canal.dataContacto")}</h4>
          <ContactFichaCard lang={lang} contact={contactInfo} />
        </div>
      );
    case "plantillas":
      return <SimpleListView title={t(lang, "cf.plantillas")} empty={empty} accent={accent} items={templatesToItems(data.templates)} />;
    case "cotizacion":
      return <ChannelQuoteTab lang={lang} accent={accent} contactId={contactId ?? ""} contactName={contactInfo?.display_name ?? ""} cards={quotesToCards(data.quotes, lang)} />;
    case "factura":
      return hasHilo && contactId ? <ChannelInvoiceTab lang={lang} contactId={contactId} /> : sinHilo;
    case "pagos":
      return hasHilo ? <CardGrid title={t(lang, "cf.pagos")} empty={t(lang, "payments.empty")} accent={accent} cards={paymentsToCards(data.payments, lang)} /> : sinHilo;
    case "agenda": return <AgendaCalendar lang={lang} accent={accent} />;
    case "sku": return <ChannelSkuTab lang={lang} accent={accent} />;
    case "config": return <ChannelConfigTab lang={lang} />;
    case "envios": return <SimpleListView title={t(lang, "cf.envios")} empty={empty} accent={accent} items={[]} />;
    case "documentos":
      return <SimpleListView title={t(lang, "cf.documentos")} empty={empty} accent={accent} items={docsToItems(data.documents)} />;
    default:
      return <ChatAmplified lang={lang} />;
  }
}