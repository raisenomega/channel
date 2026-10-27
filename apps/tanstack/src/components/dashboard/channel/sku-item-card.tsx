/**
 * HUB by Raisen — Tarjeta hija del SKU (compacta, 4 por linea): cabecera=categoria, cuerpo=nombre+descripcion,
 * badge opcional (stock/vencimiento/inactivo), pie=precio + editar/borrar. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { CatalogItem } from "@/lib/items-client";

export function SkuItemCard({ lang, item, accent, onEdit, onDelete }: {
  lang: Idioma; item: CatalogItem; accent: string; onEdit: () => void; onDelete: () => void;
}) {
  const badge = item.trackInventory || item.expiryDate || !item.isActive;
  return (
    <div className={`overflow-hidden rounded-lg border border-border/50 bg-card-soft text-xs ${item.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold" style={{ color: `hsl(${accent})` }}>
        <span className="inline-block h-1 w-1 rounded-full" style={{ background: `hsl(${accent})` }} />
        <span className="truncate">{item.categoryName || t(lang, "sku.noCat")}</span>
        {item.sku ? <span className="ml-auto truncate text-muted-foreground">{item.sku}</span> : null}
      </div>
      <div className="border-t border-border/40 px-2 py-1.5">
        <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
        {item.description ? <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{item.description}</p> : null}
      </div>
      {badge ? (
        <div className="flex flex-wrap gap-x-2 border-t border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          {item.trackInventory ? <span>{t(lang, "sku.stock")}: {item.stock ?? 0}</span> : null}
          {item.expiryDate ? <span>{t(lang, "sku.expires")}: {item.expiryDate}</span> : null}
          {!item.isActive ? <span className="font-bold text-destructive">{t(lang, "sku.inactive")}</span> : null}
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-border/40 px-2 py-1">
        <span className="text-xs font-bold text-foreground">{item.unitPrice.toFixed(2)}</span>
        <span className="flex items-center gap-1.5">
          <button type="button" onClick={onEdit} className="text-[10px] text-muted-foreground hover:text-foreground">{t(lang, "sku.edit")}</button>
          <button type="button" onClick={onDelete} className="text-destructive" aria-label={t(lang, "quotes.cancel")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" /></svg>
          </button>
        </span>
      </div>
    </div>
  );
}
