import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContactListItem } from "@/lib/contacts-client";
import { TONE_SEGMENTO } from "./contacts-data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ContactCard({ contact, language }: { contact: ContactListItem; language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{contact.displayName}</CardTitle>
        <Badge tone={TONE_SEGMENTO[contact.segment ?? ""] ?? "warn"}>
          {contact.segment ? t(language, "contacts.segment." + contact.segment) : "\u2014"}
        </Badge>
      </CardHeader>
      <CardBody>
        <Row label={t(language, "contacts.phone")} value={contact.phone ?? "\u2014"} />
        <Row label={t(language, "contacts.email")} value={contact.email ?? "\u2014"} />
        <Row label={t(language, "contacts.ltv")} value={`$${contact.ltvUsd.toFixed(2)}`} />
        <Row label={t(language, "contacts.orders")} value={String(contact.totalOrders)} />
      </CardBody>
    </Card>
  );
}