/**
 * HUB by Raisen — Tarjeta individual de Cotizacion.
 */
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { QuoteListItem } from "@/lib/quotes-client";
import { STATUS_TONE, Row } from "./quotes-utils";

export function QuoteCard({
  quote, language, onPdf,
}: {
  quote: QuoteListItem;
  language: "es" | "en";
  onPdf: (q: QuoteListItem) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t(language, "quotes.total")}: {quote.currency} {quote.totalAmount.toFixed(2)}</CardTitle>
        <Badge tone={STATUS_TONE[quote.status] ?? "warn"}>
          {t(language, "quotes.status." + quote.status)}
        </Badge>
      </CardHeader>
      <CardBody>
        <Row label={t(language, "quotes.contact")} value={quote.contactId ?? "—"} />
        <Row label={t(language, "quotes.date")} value={new Date(quote.createdAt).toLocaleDateString()} />
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onPdf(quote)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          {t(language, "quotes.generatePdf")}
        </Button>
      </CardBody>
    </Card>
  );
}