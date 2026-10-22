/**
 * HUB by Raisen — Encabezado de pagina de Cotizaciones (crear + disenar plantilla PDF).
 */
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function QuotesHeader({
  language, onCreate,
}: {
  language: "es" | "en";
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-foreground">{t(language, "quotes.title")}</h2>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t(language, "quotes.create")}
        </Button>
      </div>
    </div>
  );
}
