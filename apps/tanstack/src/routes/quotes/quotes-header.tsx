/**
 * HUB by Raisen — Encabezado de la pagina de Cotizaciones. Solo titulo: crear una cotizacion se hace
 * desde la ficha 360 del contacto en la conversacion (chip Cotizacion), no desde aqui.
 */
import { t } from "@/lib/i18n";

export function QuotesHeader({ language }: { language: "es" | "en" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-foreground">{t(language, "quotes.title")}</h2>
    </div>
  );
}
