/**
 * HUB by Raisen — Ruta /pdf-templates (seccion propia "Plantilla PDF", separada de Cotizaciones que
 * es solo para cotizaciones reales a clientes). Muestra la fila de la plantilla activa (estilo elegido
 * + "En uso"); al hacer clic abre el editor. Distinta de /templates (plantillas de mensajes). C4 <=75.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { TemplateRow } from "./quotes/quotes-template-row";
import { TemplateEditorModal } from "./quotes/pdf/template-editor-modal";

function PdfTemplatesPage() {
  const { language } = usePreferences();
  const [open, setOpen] = useState(false);
  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "nav.pdfTemplates")}</h2>
      <p className="text-sm text-muted-foreground">{t(language, "quotes.tpl.sectionHint")}</p>
      <TemplateRow lang={language} onOpen={() => setOpen(true)} />
      {open && <TemplateEditorModal lang={language} onClose={() => setOpen(false)} />}
    </div>
  );
}

export const PdfTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pdf-templates",
  component: PdfTemplatesPage,
});
