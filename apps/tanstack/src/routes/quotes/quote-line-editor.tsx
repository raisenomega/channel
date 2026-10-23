/**
 * HUB by Raisen — Editor de lineas de una cotizacion (una a la vez): [Sku] + descripcion + cantidad +
 * precio + descuento%. line_total = cant * precio * (1 - desc%/100). El tax es a nivel documento. El
 * boton [Sku] (primera celda) llena la linea desde el catalogo. C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuoteLine } from "@/lib/quotes-client";
import { listItems, type CatalogItem } from "@/lib/items-client";
import { LineItemPicker } from "./line-item-picker";

const INP = "w-full rounded border border-border/55 bg-card-soft p-1 text-sm text-foreground";
const calc = (l: QuoteLine): number => l.quantity * l.unitPrice * (1 - l.discountPct / 100);

export function QuoteLineEditor({ lang, items, currency, onChange }: {
  lang: Idioma; items: QuoteLine[]; currency: string; onChange: (items: QuoteLine[]) => void;
}) {
  const cat = useQuery({ queryKey: ["catalog-items"], queryFn: listItems, staleTime: 30_000 }).data ?? [];
  const set = (idx: number, k: keyof QuoteLine, v: string) =>
    onChange(items.map((it, i) => (i !== idx ? it : { ...{ ...it, [k]: k === "description" ? v : Number(v) }, lineTotal: calc({ ...it, [k]: k === "description" ? v : Number(v) } as QuoteLine) } as QuoteLine)));
  const fill = (idx: number, c: CatalogItem) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, description: c.description || c.name, unitPrice: c.unitPrice, lineTotal: it.quantity * c.unitPrice * (1 - it.discountPct / 100) } : it)));
  const add = () => onChange([...items, { description: "", quantity: 1, unitPrice: 0, discountPct: 0, lineTotal: 0 }]);
  const rm = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{t(lang, "quotes.line.items")}</span>
        <button type="button" onClick={add} className="chip text-xs font-bold">+ {t(lang, "quotes.line.add")}</button>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 items-start gap-1">
          <div className="col-span-2"><LineItemPicker lang={lang} cat={cat} onPick={(c) => fill(idx, c)} /></div>
          <input value={it.description} onChange={(e) => set(idx, "description", e.target.value)} placeholder={t(lang, "doc.description")} className={`${INP} col-span-3`} />
          <input type="number" value={it.quantity || ""} onChange={(e) => set(idx, "quantity", e.target.value)} placeholder={t(lang, "doc.qty")} className={`${INP} col-span-2`} />
          <input type="number" value={it.unitPrice || ""} onChange={(e) => set(idx, "unitPrice", e.target.value)} placeholder={t(lang, "doc.price")} className={`${INP} col-span-2`} />
          <input type="number" value={it.discountPct || ""} onChange={(e) => set(idx, "discountPct", e.target.value)} placeholder="%" className={`${INP} col-span-1`} />
          <span className="col-span-1 pt-1 text-right text-[11px] font-semibold">{currency} {it.lineTotal.toFixed(0)}</span>
          <button type="button" onClick={() => rm(idx)} className="col-span-1 pt-1 text-destructive" aria-label={t(lang, "quotes.cancel")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
