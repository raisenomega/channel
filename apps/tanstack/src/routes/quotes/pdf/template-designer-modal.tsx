/**
 * HUB by Raisen — "Crear plantilla": 3 estilos (vista de muestra estilo Nucleo) con seleccion
 * INSTANTANEA (optimista) + config de logo y mensaje de pie. Guarda en branding_config. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { fetchBusinessInfo, type BizInfo } from "./pdf-business-info";
import { savePdfStyle } from "./pdf-style-store";
import { PDF_STYLES } from "./pdf-styles";
import { BusinessDocument, type DocLabels } from "./business-document";
import { TemplateConfigRow } from "./template-config-row";

const S_ITEMS = [
  { description: "Servicio A", quantity: 2, unitPrice: 100, discountPct: 0, taxPct: 11.5, lineTotal: 223 },
  { description: "Producto B", quantity: 1, unitPrice: 50, discountPct: 10, taxPct: 11.5, lineTotal: 50.18 },
];
const S_TOTALS = { subtotal: 245, tax: 28.18, total: 273.18, currency: "USD" };

export function TemplateDesignerModal({ lang, onClose }: { lang: Idioma; onClose: () => void }) {
  const qc = useQueryClient();
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const tid = mi.data?.tenantId ?? "";
  const bizQ = useQuery({ queryKey: ["pdf-biz", tid], queryFn: () => fetchBusinessInfo(tid), enabled: !!tid });
  const [sel, setSel] = useState<string | null>(null);
  const current = sel ?? bizQ.data?.style ?? "clasico";
  const biz: BizInfo = { name: bizQ.data?.name || "HUB by Raisen", phone: bizQ.data?.phone || "", address: bizQ.data?.address || "", legalName: bizQ.data?.legalName || "", taxId: bizQ.data?.taxId || "", logoUrl: bizQ.data?.logoUrl || null, footer: bizQ.data?.footer || "", style: current };
  const headers = [t(lang, "doc.description"), t(lang, "doc.qty"), t(lang, "doc.price"), t(lang, "doc.disc"), t(lang, "doc.tax"), t(lang, "doc.total")];
  const labels: DocLabels = { subtotal: t(lang, "doc.subtotal"), tax: t(lang, "doc.taxTotal"), total: t(lang, "quotes.total"), client: t(lang, "quotes.contact") };
  const pick = async (id: string) => { setSel(id); if (tid) { await savePdfStyle(tid, id); await qc.invalidateQueries({ queryKey: ["pdf-biz"] }); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{t(lang, "quotes.template.title")}</h3>
          <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {PDF_STYLES.map((s) => (
              <div key={s.id} className={"rounded-xl border p-2 " + (current === s.id ? "border-primary" : "border-border/40")}>
                <div className="mb-2 text-center text-xs font-bold text-foreground">{t(lang, "quotes.style." + s.id)}</div>
                <div className="h-[250px] overflow-hidden rounded bg-neutral-200"><div className="origin-top scale-[0.52]"><BusinessDocument title={t(lang, "quotes.pdf.title")} style={s} biz={biz} refId="A1B2C3" client={{ name: "Juan Perez", lines: ["+1 787 555 0100"] }} items={S_ITEMS} totals={S_TOTALS} headers={headers} labels={labels} /></div></div>
                <button type="button" className={"chip mt-2 w-full justify-center font-bold " + (current === s.id ? "text-white" : "")} style={current === s.id ? { background: "hsl(var(--primary))" } : undefined} onClick={() => void pick(s.id)}>{current === s.id ? t(lang, "quotes.style.current") : t(lang, "quotes.style.use")}</button>
              </div>
            ))}
          </div>
          <TemplateConfigRow lang={lang} tid={tid} logoUrl={biz.logoUrl} footer={bizQ.data?.footer || ""} />
        </div>
      </div>
    </div>
  );
}
