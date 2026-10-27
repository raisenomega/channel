/**
 * HUB by Raisen — Modal SKU grande (estilo editor de cotizacion): crear/editar item con todos los campos +
 * [+Categoria] arriba-derecha (crea al vuelo y la selecciona). Mismo shell glass-card que QuotePdfModal. C4 <=75.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { createItem, updateItem, createCategory, type CatalogItem, type Category, type ItemInput } from "@/lib/items-client";
import { SkuItemFields } from "./sku-item-fields";

function init(e: CatalogItem | null): ItemInput {
  return {
    name: e?.name ?? "", description: e?.description ?? "", unit_price: e?.unitPrice ?? 0, category_id: e?.categoryId ?? null,
    item_type: e?.itemType ?? "servicio", sku: e?.sku ?? "", stock: e?.stock == null ? "" : String(e.stock),
    track_inventory: e?.trackInventory ?? false, lot_number: e?.lotNumber ?? "", expiry_date: e?.expiryDate ?? "",
    unit_cost: e?.unitCost ?? 0, tax_rate: e?.taxRate ?? 11.5, unit_of_measure: e?.unitOfMeasure ?? "",
    barcode: e?.barcode ?? "", image_url: e?.imageUrl ?? "", is_active: e?.isActive ?? true,
  };
}

export function SkuItemModal({ lang, cats, editing, onClose, onSaved }: {
  lang: Idioma; cats: Category[]; editing: CatalogItem | null; onClose: () => void; onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState<ItemInput>(() => init(editing));
  const [adding, setAdding] = useState(false);
  const [catName, setCatName] = useState("");
  const [busy, setBusy] = useState(false);
  const up = (k: keyof ItemInput, v: string | number | boolean | null) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.name.trim() || busy) return;
    setBusy(true);
    const okr = editing ? await updateItem(editing.id, f) : await createItem(f);
    setBusy(false);
    if (okr) onSaved();
  };
  const addCat = async () => {
    const id = await createCategory(catName.trim());
    if (id) { await qc.invalidateQueries({ queryKey: ["item-categories"] }); up("category_id", id); }
    setCatName(""); setAdding(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{t(lang, editing ? "sku.editItem" : "sku.newItem")}</h3>
          <div className="flex items-center gap-2">
            {adding ? (
              <>
                <input autoFocus value={catName} maxLength={40} onChange={(e) => setCatName(e.target.value)} placeholder={t(lang, "sku.catName")} className="rounded-lg border border-border/55 bg-card-soft p-1.5 text-sm text-foreground" />
                <button type="button" className="chip font-bold text-white" style={{ background: "hsl(var(--primary))" }} disabled={!catName.trim()} onClick={() => void addCat()}>{t(lang, "sku.catAdd")}</button>
              </>
            ) : <button type="button" className="chip font-bold" onClick={() => setAdding(true)}>+ {t(lang, "sku.category")}</button>}
            <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5"><SkuItemFields lang={lang} cats={cats} f={f} up={up} /></div>
        <div className="flex justify-end gap-2 border-t border-border/40 px-4 py-3">
          <button type="button" className="chip" onClick={onClose}>{t(lang, "quotes.cancel")}</button>
          <button type="button" className="chip font-bold text-white" style={{ background: "hsl(var(--primary))" }} disabled={!f.name.trim() || busy} onClick={() => void save()}>{t(lang, "quotes.save")}</button>
        </div>
      </div>
    </div>
  );
}
