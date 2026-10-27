/**
 * HUB by Raisen — Campos del modal SKU (afinidad Nucleo): basicos + inventario (sku/costo/impuesto/stock/
 * lote/vencimiento) + extras (unidad/barcode/activo/imagen). Controlado por el padre (f + up). C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { ItemInput, Category } from "@/lib/items-client";

const INP = "w-full rounded-lg border border-border/55 bg-card-soft p-2 text-sm text-foreground";
const LBL = "pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
const CHK = "flex items-center gap-2 rounded-lg border border-border/55 bg-card-soft p-2 text-sm text-foreground";

export function SkuItemFields({ lang, cats, f, up }: {
  lang: Idioma; cats: Category[]; f: ItemInput; up: (k: keyof ItemInput, v: string | number | boolean | null) => void;
}) {
  return (
    <div className="space-y-3">
      <input value={f.name} maxLength={75} onChange={(e) => up("name", e.target.value)} placeholder={`${t(lang, "sku.name")} (75)`} className={INP} />
      <textarea value={f.description} maxLength={750} rows={3} onChange={(e) => up("description", e.target.value)} placeholder={`${t(lang, "sku.desc")} (750)`} className={INP} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={f.unit_price || ""} onChange={(e) => up("unit_price", Number(e.target.value) || 0)} placeholder={t(lang, "sku.price")} className={INP} />
        <select value={f.category_id ?? ""} onChange={(e) => up("category_id", e.target.value || null)} className={INP}>
          <option value="">{t(lang, "sku.noCat")}</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <p className={LBL}>{t(lang, "sku.inventory")}</p>
      <div className="grid grid-cols-3 gap-2">
        <input value={f.sku} onChange={(e) => up("sku", e.target.value)} placeholder={t(lang, "sku.sku")} className={INP} />
        <input type="number" value={f.unit_cost || ""} onChange={(e) => up("unit_cost", Number(e.target.value) || 0)} placeholder={t(lang, "sku.cost")} className={INP} />
        <input type="number" value={f.tax_rate} onChange={(e) => up("tax_rate", Number(e.target.value) || 0)} placeholder={t(lang, "sku.tax")} className={INP} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={CHK}><input type="checkbox" checked={f.track_inventory} onChange={(e) => up("track_inventory", e.target.checked)} />{t(lang, "sku.trackStock")}</label>
        <input type="number" value={f.stock} onChange={(e) => up("stock", e.target.value)} placeholder={t(lang, "sku.stock")} className={INP} disabled={!f.track_inventory} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={f.lot_number} onChange={(e) => up("lot_number", e.target.value)} placeholder={t(lang, "sku.lot")} className={INP} />
        <input type="date" value={f.expiry_date} onChange={(e) => up("expiry_date", e.target.value)} className={INP} />
      </div>
      <p className={LBL}>{t(lang, "sku.more")}</p>
      <div className="grid grid-cols-3 gap-2">
        <input value={f.unit_of_measure} onChange={(e) => up("unit_of_measure", e.target.value)} placeholder={t(lang, "sku.uom")} className={INP} />
        <input value={f.barcode} onChange={(e) => up("barcode", e.target.value)} placeholder={t(lang, "sku.barcode")} className={INP} />
        <label className={CHK}><input type="checkbox" checked={f.is_active} onChange={(e) => up("is_active", e.target.checked)} />{t(lang, "sku.active")}</label>
      </div>
      <input value={f.image_url} onChange={(e) => up("image_url", e.target.value)} placeholder={t(lang, "sku.image")} className={INP} />
    </div>
  );
}
