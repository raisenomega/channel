/**
 * HUB by Raisen — Selector [Sku] inline para una linea de cotizacion: boton que despliega hacia abajo
 * los items del catalogo agrupados por categoria; al elegir uno llena la linea y cierra. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import type { CatalogItem } from "@/lib/items-client";

export function LineItemPicker({ lang, cat, onPick }: { lang: Idioma; cat: CatalogItem[]; onPick: (it: CatalogItem) => void }) {
  const [open, setOpen] = useState(false);
  const groups = new Map<string, CatalogItem[]>();
  for (const it of cat) { const k = it.categoryName || t(lang, "sku.noCat"); groups.set(k, [...(groups.get(k) ?? []), it]); }
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="chip w-full text-[11px] font-bold">{t(lang, "sku.pickShort")}</button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-56 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-xl">
            {cat.length === 0 ? <p className="p-2 text-xs text-muted-foreground">{t(lang, "sku.empty")}</p> : [...groups.entries()].map(([g, its]) => (
              <div key={g}>
                <p className="px-2 pt-1 text-[10px] font-bold uppercase text-muted-foreground">{g}</p>
                {its.map((it) => (
                  <button key={it.id} type="button" onClick={() => { onPick(it); setOpen(false); }} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted/40">
                    <span className="truncate text-foreground">{it.name}</span><span className="shrink-0 text-muted-foreground">{it.unitPrice.toFixed(0)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
