/**
 * HUB by Raisen — Encabezado de la pagina de Facturas (espejo de QuotesHeader). Solo titulo: las facturas
 * nacen al convertir una cotizacion (desde la ficha 360 / pestana Factura del canal), no se crean aqui.
 */
import { t } from "@/lib/i18n";

export function InvoicesHeader({ language }: { language: "es" | "en" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-foreground">{t(language, "invoices.title")}</h2>
    </div>
  );
}
