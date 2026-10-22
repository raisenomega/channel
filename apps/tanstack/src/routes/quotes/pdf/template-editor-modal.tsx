/**
 * HUB by Raisen — Editor de plantilla PDF: la pagina PDF EN VIVO de fondo + panel de edicion
 * (estilo, logo, compañia, tax, pie, terminos). Editas -> lo ves al instante -> Guardar -> En uso.
 * Guarda todo en branding_config. C4 <=75.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { fetchBusinessInfo, type BizInfo } from "./pdf-business-info";
import { savePdfStyle, saveTemplateConfig } from "./pdf-style-store";
import { uploadLogo } from "@/lib/tenant-client/logo";
import { styleOf } from "./pdf-styles";
import { BusinessDocument, type DocLabels } from "./business-document";
import { TemplateEditPanel, type TplForm } from "./template-edit-panel";

const S_ITEMS = [{ description: "Servicio A", quantity: 2, unitPrice: 100, lineTotal: 200 }, { description: "Producto B", quantity: 1, unitPrice: 50, lineTotal: 50 }];
const fromBiz = (b: BizInfo): TplForm => ({ name: b.name, address: b.address, phone: b.phone, email: b.email, taxMode: b.tax.mode, taxValue: String(b.tax.value), currency: b.tax.currency, footer1: b.footer1, terms: b.terms });

export function TemplateEditorModal({ lang, onClose }: { lang: Idioma; onClose: () => void }) {
  const qc = useQueryClient();
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const tid = mi.data?.tenantId ?? "";
  const bizQ = useQuery({ queryKey: ["pdf-biz", tid], queryFn: () => fetchBusinessInfo(tid), enabled: !!tid });
  const [form, setForm] = useState<TplForm | null>(null);
  const [style, setStyle] = useState("clasico");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  useEffect(() => { if (bizQ.data && !form) { setForm(fromBiz(bizQ.data)); setStyle(bizQ.data.style); } }, [bizQ.data, form]);
  if (!form) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 text-sm text-white">{t(lang, "common.loading")}…</div>;
  const set = <K extends keyof TplForm>(k: K, v: TplForm[K]) => { setForm((p) => (p ? { ...p, [k]: v } : p)); setDirty(true); };
  const tv = Number(form.taxValue) || 0;
  const taxAmt = form.taxMode === "pct" ? 250 * tv / 100 : tv;
  const liveBiz: BizInfo = { name: form.name, phone: form.phone, email: form.email, address: form.address, logoUrl: bizQ.data?.logoUrl ?? null, style, tax: { mode: form.taxMode, value: tv, currency: form.currency }, footer1: form.footer1, terms: form.terms };
  const totals = { subtotal: 250, tax: taxAmt, total: 250 + taxAmt, currency: form.currency };
  const headers = [t(lang, "doc.description"), t(lang, "doc.qty"), t(lang, "doc.price"), t(lang, "doc.total")];
  const labels: DocLabels = { subtotal: t(lang, "doc.subtotal"), tax: t(lang, "doc.taxTotal"), total: t(lang, "quotes.total"), client: t(lang, "quotes.contact"), terms: t(lang, "quotes.tpl.terms") };
  const onLogo = async (f: File | undefined) => { if (!f || !tid) return; setBusy("logo"); await uploadLogo(tid, f); await qc.invalidateQueries({ queryKey: ["pdf-biz"] }); await qc.invalidateQueries({ queryKey: ["mi-logo"] }); setBusy(""); };
  const onSave = async () => { if (!tid) return; setBusy("save"); await saveTemplateConfig(tid, { company: { name: form.name, address: form.address, phone: form.phone, email: form.email }, tax: { mode: form.taxMode, value: tv, currency: form.currency }, footer1: form.footer1, terms: form.terms }); await qc.invalidateQueries({ queryKey: ["pdf-biz"] }); setBusy(""); setDirty(false); };
  const onUse = async () => { if (tid) { await savePdfStyle(tid, style); await qc.invalidateQueries({ queryKey: ["pdf-biz"] }); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3" onClick={onClose}>
      <div className="glass-card flex max-h-[92vh] w-full max-w-6xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="hidden flex-1 overflow-y-auto bg-neutral-300 p-4 md:block">
          <BusinessDocument title={t(lang, "quotes.pdf.title")} style={styleOf(style)} biz={liveBiz} refId="A1B2C3" client={{ name: "Juan Perez", lines: ["+1 787 555 0100"] }} items={S_ITEMS} totals={totals} headers={headers} labels={labels} />
        </div>
        <div className="flex w-full flex-col md:w-[380px] md:border-l md:border-border/40">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <h3 className="text-base font-bold text-foreground">{t(lang, "quotes.template.title")}</h3>
            <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TemplateEditPanel lang={lang} accent="var(--primary)" form={form} set={set} style={style} onStyle={(s) => { setStyle(s); setDirty(true); }} logoUrl={bizQ.data?.logoUrl ?? null} onLogo={(f) => void onLogo(f)} onSave={() => void onSave()} onUse={() => void onUse()} dirty={dirty} busy={busy} />
          </div>
        </div>
      </div>
    </div>
  );
}
