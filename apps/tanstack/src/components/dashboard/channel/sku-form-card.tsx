/**
 * HUB by Raisen — Tarjeta madre del SKU (formulario estilo Meta): nombre (12) + descripcion (250) +
 * precio + dropdown categoria. Guardar crea/edita; al guardar el padre remonta el form (key). C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import type { Category, CatalogItem } from "@/lib/items-client";

const INP = "w-full rounded border border-border/55 bg-card-soft p-1.5 text-sm text-foreground";

export function SkuFormCard({ lang, cats, editing, onSave, onCancel }: {
  lang: Idioma; cats: Category[]; editing: CatalogItem | null;
  onSave: (name: string, desc: string, price: number, categoryId: string | null) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [desc, setDesc] = useState(editing?.description ?? "");
  const [price, setPrice] = useState(editing ? String(editing.unitPrice) : "");
  const [cat, setCat] = useState(editing?.categoryId ?? "");
  const save = () => { if (name.trim()) onSave(name.trim(), desc.trim(), Number(price) || 0, cat || null); };
  return (
    <div className="space-y-2 rounded-xl border-2 border-dashed border-border/60 bg-card p-3">
      <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder={`${t(lang, "sku.name")} (12)`} className={INP} />
      <textarea value={desc} maxLength={250} rows={2} onChange={(e) => setDesc(e.target.value)} placeholder={`${t(lang, "sku.desc")} (250)`} className={INP} />
      <div className="flex gap-2">
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t(lang, "sku.price")} className={`${INP} flex-1`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${INP} flex-1`}>
          <option value="">{t(lang, "sku.noCat")}</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={!name.trim()} className="chip flex-1 font-bold">{t(lang, editing ? "quotes.save" : "sku.add")}</button>
        {editing ? <button type="button" onClick={onCancel} className="chip">{t(lang, "quotes.cancel")}</button> : null}
      </div>
    </div>
  );
}
