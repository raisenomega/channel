/**
 * HUB by Raisen — Tarjeta hija del SKU (estilo plantilla de Meta): cabecera=categoria, cuerpo=nombre+
 * descripcion, pie=precio + editar/borrar. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { CatalogItem } from "@/lib/items-client";

export function SkuItemCard({ lang, item, accent, onEdit, onDelete }: {
  lang: Idioma; item: CatalogItem; accent: string; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card-soft">
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold" style={{ color: `hsl(${accent})` }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: `hsl(${accent})` }} />
        {item.categoryName || t(lang, "sku.noCat")}
      </div>
      <div className="border-t border-border/40 px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{item.name}</p>
        {item.description ? <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p> : null}
      </div>
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-1.5">
        <span className="text-sm font-bold text-foreground">{item.unitPrice.toFixed(2)}</span>
        <span className="flex items-center gap-2">
          <button type="button" onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground">{t(lang, "sku.edit")}</button>
          <button type="button" onClick={onDelete} className="text-destructive" aria-label={t(lang, "quotes.cancel")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" /></svg>
          </button>
        </span>
      </div>
    </div>
  );
}
