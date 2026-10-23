/**
 * HUB by Raisen — Panel de edicion de la plantilla: estilo, logo, compañia (nombre/direccion/tel/
 * email), tax (% o fijo + moneda), pie corto (100) y terminos (2500) + Guardar / En uso. C4 <=75.
 */
import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { PDF_STYLES } from "./pdf-styles";

export interface TplForm {
  name: string; address: string; phone: string; email: string;
  taxMode: "pct" | "fixed"; taxValue: string; currency: string; footer1: string; terms: string;
}
const INP = "w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground";
const CUR = ["USD", "MXN", "DOP", "COP", "EUR"];
function L({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs"><span className="mb-0.5 block text-muted-foreground">{label}</span>{children}</label>;
}

export function TemplateEditPanel({ lang, accent, form, set, style, onStyle, logoUrl, onLogo, seq, onSeq, onSave, onUse, dirty, busy, msg }: {
  lang: Idioma; accent: string; form: TplForm; set: <K extends keyof TplForm>(k: K, v: TplForm[K]) => void;
  style: string; onStyle: (s: string) => void; logoUrl: string | null; onLogo: (f: File | undefined) => void;
  seq: string; onSeq: (v: string) => void;
  onSave: () => void; onUse: () => void; dirty: boolean; busy: string; msg: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">{PDF_STYLES.map((s) => <button key={s.id} type="button" className={"chip text-xs" + (style === s.id ? " active" : "")} style={style === s.id ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined} onClick={() => onStyle(s.id)}>{t(lang, "quotes.style." + s.id)}</button>)}</div>
      <div className="flex items-center gap-2">
        {logoUrl ? <img src={logoUrl} alt="" className="h-9 w-9 rounded object-contain" /> : null}
        <label className="chip cursor-pointer text-xs">{busy === "logo" ? t(lang, "onboarding.saving") : t(lang, "quotes.template.logoBtn")}<input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] ?? undefined)} /></label>
        <input value={seq} onChange={(e) => onSeq(e.target.value)} placeholder={t(lang, "tpl.seqPh")} className="flex-1 rounded border border-border/55 bg-card-soft p-1.5 text-sm text-foreground" />
      </div>
      <L label={t(lang, "quotes.tpl.name")}><input className={INP} value={form.name} onChange={(e) => set("name", e.target.value)} /></L>
      <L label={t(lang, "quotes.tpl.address")}><input className={INP} value={form.address} onChange={(e) => set("address", e.target.value)} /></L>
      <div className="grid grid-cols-2 gap-2">
        <L label={t(lang, "quotes.tpl.phone")}><input className={INP} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></L>
        <L label={t(lang, "quotes.tpl.email")}><input className={INP} value={form.email} onChange={(e) => set("email", e.target.value)} /></L>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <L label={t(lang, "quotes.tpl.taxMode")}><select className={INP} value={form.taxMode} onChange={(e) => set("taxMode", e.target.value === "fixed" ? "fixed" : "pct")}><option value="pct">%</option><option value="fixed">{t(lang, "quotes.tpl.fixed")}</option></select></L>
        <L label={t(lang, "quotes.tpl.taxValue")}><input type="number" className={INP} value={form.taxValue} onChange={(e) => set("taxValue", e.target.value)} /></L>
        <L label={t(lang, "quotes.tpl.currency")}><select className={INP} value={form.currency} onChange={(e) => set("currency", e.target.value)}>{CUR.map((c) => <option key={c} value={c}>{c}</option>)}</select></L>
      </div>
      <L label={`${t(lang, "quotes.tpl.footer1")} (${form.footer1.length}/100)`}><input maxLength={100} className={INP} value={form.footer1} onChange={(e) => set("footer1", e.target.value)} /></L>
      <L label={`${t(lang, "quotes.tpl.terms")} (${form.terms.length}/2500)`}><textarea maxLength={2500} rows={3} className={INP} value={form.terms} onChange={(e) => set("terms", e.target.value)} /></L>
      <div className="flex items-center gap-2 pt-1">
        <button type="button" className="chip font-bold text-white" style={{ background: `hsl(${accent})` }} onClick={onSave}>{busy === "save" ? t(lang, "onboarding.saving") : t(lang, "quotes.tpl.save")}</button>
        <button type="button" className="chip font-bold" disabled={dirty} onClick={onUse} style={!dirty ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined}>{t(lang, "quotes.style.use")}</button>
        {msg ? <span className={"text-[11px] font-semibold " + (msg === "saved" ? "text-green-500" : "text-red-400")}>{t(lang, "quotes.tpl." + msg)}</span> : null}
      </div>
    </div>
  );
}
