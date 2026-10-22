/**
 * HUB by Raisen — Config de plantilla: cambiar el logo + mensaje de pie (guardan en branding_config,
 * el mismo logo de la barra Crear negocio). Refresca la vista previa al instante. C4 <=75.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { uploadLogo } from "@/lib/tenant-client/logo";
import { savePdfFooter } from "./pdf-style-store";

export function TemplateConfigRow({ lang, tid, logoUrl, footer }: {
  lang: Idioma; tid: string; logoUrl: string | null; footer: string;
}) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState<string>("");
  const val = edit ?? footer;
  const onLogo = async (file: File | undefined) => {
    if (!file || !tid) return;
    setBusy("logo");
    await uploadLogo(tid, file);
    await qc.invalidateQueries({ queryKey: ["pdf-biz"] });
    await qc.invalidateQueries({ queryKey: ["mi-logo"] });
    setBusy("");
  };
  const saveF = async () => {
    if (!tid) return;
    setBusy("foot");
    await savePdfFooter(tid, val);
    await qc.invalidateQueries({ queryKey: ["pdf-biz"] });
    setBusy("footdone");
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">{t(lang, "quotes.template.logo")}</span>
        <div className="flex items-center gap-2">
          {logoUrl ? <img src={logoUrl} alt="" className="h-10 w-10 rounded object-contain" /> : null}
          <label className="chip cursor-pointer text-xs">
            {busy === "logo" ? t(lang, "onboarding.saving") : t(lang, "quotes.template.logoBtn")}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void onLogo(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">{t(lang, "quotes.template.footer")}</span>
        <textarea className="w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground" rows={2} value={val} placeholder={t(lang, "quotes.template.footerPh")} onChange={(e) => setEdit(e.target.value)} />
        <button type="button" className="chip mt-1 font-bold text-white" style={{ background: "hsl(var(--primary))" }} onClick={() => void saveF()}>
          {busy === "footdone" ? t(lang, "quotes.pdf.saved") : t(lang, "quotes.template.saveFooter")}
        </button>
      </div>
    </div>
  );
}
