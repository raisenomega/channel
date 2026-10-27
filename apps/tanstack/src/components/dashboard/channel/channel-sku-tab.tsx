/**
 * HUB by Raisen — Pestana SKU: barra de categorias + boton [Crear item] que abre el modal grande (crear/
 * editar con todos los campos), + grid de tarjetas. Alta/edicion via modal; borrado inline. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { listItems, listCategories, deleteItem, type CatalogItem } from "@/lib/items-client";
import { SkuCategoryBar } from "./sku-category-bar";
import { SkuItemModal } from "./sku-item-modal";
import { SkuItemCard } from "./sku-item-card";

export function ChannelSkuTab({ lang, accent }: { lang: Idioma; accent: string }) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["catalog-items"], queryFn: listItems, staleTime: 30_000 }).data ?? [];
  const cats = useQuery({ queryKey: ["item-categories"], queryFn: listCategories, staleTime: 30_000 }).data ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const inv = () => void qc.invalidateQueries({ queryKey: ["catalog-items"] });
  const rm = async (id: string) => { await deleteItem(id); inv(); };
  const nuevo = () => { setEditing(null); setOpen(true); };
  const editar = (it: CatalogItem) => { setEditing(it); setOpen(true); };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})` }}>{t(lang, "cf.sku")}</h4>
        <button type="button" className="chip font-bold text-white" style={{ background: "hsl(var(--primary))" }} onClick={nuevo}>{t(lang, "sku.create")}</button>
      </div>
      <SkuCategoryBar lang={lang} accent={accent} />
      {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "sku.empty")}</p> : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {items.map((it) => <SkuItemCard key={it.id} lang={lang} item={it} accent={accent} onEdit={() => editar(it)} onDelete={() => void rm(it.id)} />)}
        </div>
      )}
      {open ? <SkuItemModal lang={lang} cats={cats} editing={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); inv(); }} /> : null}
    </div>
  );
}
