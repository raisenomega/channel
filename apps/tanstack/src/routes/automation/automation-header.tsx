/**
 * HUB by Raisen — Encabezado de pagina de Automatizaciones.
 */
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function AutomationHeader({
  language, onCreate,
}: {
  language: "es" | "en";
  onCreate: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground">{t(language, "automation.title")}</h2>
      <Button variant="primary" size="sm" onClick={onCreate}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        {t(language, "automation.create")}
      </Button>
    </div>
  );
}