/**
 * HUB by Raisen — Pestana Configuracion: editor de la Plantilla PDF del negocio (movido del nav
 * principal). Reusa TemplateRow + TemplateEditorModal. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { TemplateRow } from "@/routes/quotes/quotes-template-row";
import { TemplateEditorModal } from "@/routes/quotes/pdf/template-editor-modal";

export function ChannelConfigTab({ lang }: { lang: Idioma }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t(lang, "quotes.tpl.sectionHint")}</p>
      <TemplateRow lang={lang} onOpen={() => setOpen(true)} />
      {open && <TemplateEditorModal lang={lang} onClose={() => setOpen(false)} />}
    </div>
  );
}
