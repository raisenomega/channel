/**
 * HUB by Raisen — Un campo editable del Contexto (text / textarea / select). C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { CtxField } from "./contexto-fields";

const CLS = "w-full rounded border border-border/55 bg-card-soft p-1.5 text-sm text-foreground";

export function ContextoField({ lang, field, value, onChange }: { lang: Idioma; field: CtxField; value: string; onChange: (k: string, v: string) => void }) {
  return (
    <label className="block text-xs">
      <span className="mb-0.5 block font-semibold text-muted-foreground">{t(lang, field.label)}</span>
      {field.kind === "select"
        ? <select value={value} onChange={(e) => onChange(field.key, e.target.value)} className={CLS}><option value="">—</option>{(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : field.kind === "area"
        ? <textarea value={value} onChange={(e) => onChange(field.key, e.target.value)} rows={2} className={CLS} />
        : <input value={value} onChange={(e) => onChange(field.key, e.target.value)} className={CLS} />}
    </label>
  );
}
