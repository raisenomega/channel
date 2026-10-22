/**
 * HUB by Raisen — "Crear plantilla": muestra los 3 estilos con datos de muestra y guarda el elegido
 * (branding_config.pdf_style) para todo el ciclo. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { PDF_STYLES } from "./pdf-styles";
import { BusinessDocument } from "./business-document";
import { fetchPdfStyle, savePdfStyle } from "./pdf-style-store";

export function TemplateDesignerModal({ lang, onClose }: { lang: Idioma; onClose: () => void }) {
  const qc = useQueryClient();
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const cur = useQuery({ queryKey: ["pdf-style", mi.data?.tenantId], queryFn: () => fetchPdfStyle(mi.data?.tenantId ?? ""), enabled: !!mi.data?.tenantId });
  const [busy, setBusy] = useState(false);
  const bizName = mi.data?.name || "HUB by Raisen";
  const rows = [{ label: t(lang, "quotes.contact"), value: "Juan Perez" }, { label: t(lang, "quotes.date"), value: new Date().toLocaleDateString() }];
  const total = { label: t(lang, "quotes.total"), value: "USD 250.00" };
  const pick = async (id: string) => {
    if (!mi.data) return;
    setBusy(true); await savePdfStyle(mi.data.tenantId, id); await qc.invalidateQueries({ queryKey: ["pdf-style"] }); setBusy(false); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{t(lang, "quotes.template.title")}</h3>
          <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
        </div>
        <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {PDF_STYLES.map((s) => (
            <div key={s.id} className={"rounded-xl border p-2 " + (cur.data === s.id ? "border-primary" : "border-border/40")}>
              <div className="mb-2 text-center text-xs font-bold text-foreground">{t(lang, "quotes.style." + s.id)}</div>
              <div className="h-[230px] overflow-hidden rounded bg-neutral-200">
                <div className="origin-top scale-[0.62]"><BusinessDocument title={t(lang, "quotes.pdf.title")} style={s} bizName={bizName} refId="A1B2C3" rows={rows} total={total} /></div>
              </div>
              <button type="button" className="chip mt-2 w-full justify-center font-bold text-white" style={{ background: "hsl(var(--primary))" }} disabled={busy} onClick={() => void pick(s.id)}>
                {cur.data === s.id ? t(lang, "quotes.style.current") : t(lang, "quotes.style.use")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
