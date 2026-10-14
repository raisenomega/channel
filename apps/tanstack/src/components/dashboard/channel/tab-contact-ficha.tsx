/**
 * HUB by Raisen — ContactFichaCard: ficha 360 del contacto del hilo
 * activo (pestaña "contactos" del panel de canal).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Row } from "./tab-card-grid";
import type { ActiveContactInfo } from "./channel-fetchers";

export function ContactFichaCard({ lang, contact }: { lang: Idioma; contact: ActiveContactInfo }) {
  const segment = contact.segment ? t(lang, "contacts.segment." + contact.segment) : "—";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{contact.display_name ?? "—"}</CardTitle>
        <Badge tone={contact.segment ? "hub" : "warn"} dot>{segment}</Badge>
      </CardHeader>
      <CardBody>
        <Row label={t(lang, "contacts.phone")} value={contact.primary_phone ?? "—"} />
        <Row label={t(lang, "contacts.email")} value={contact.primary_email ?? "—"} />
        <Row label={t(lang, "contacts.segment")} value={segment} />
        <Row label={t(lang, "contacts.ltv")} value={`$${(contact.ltv_usd ?? 0).toFixed(2)}`} />
        <Row label={t(lang, "contacts.orders")} value={String(contact.total_orders ?? 0)} />
      </CardBody>
    </Card>
  );
}