/**
 * HUB by Raisen — Pestana SKU (tarjetas estilo Meta): barra de categorias + tarjeta madre (form) +
 * tarjetas hijas (items guardados). Alta/edicion/borrado via RPC por negocio. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { listItems, listCategories, createItem, updateItem, deleteItem, type CatalogItem } from "@/lib/items-client";
import { SkuCategoryBar } from "./sku-category-bar";
import { SkuFormCard } from "./sku-form-card";
import { SkuItemCard } from "./sku-item-card";

export function ChannelSkuTab({ lang, accent }: { lang: Idioma; accent: string }) {
  const qc = useQueryClient();
  const items = useQuery({ queryKey: ["catalog-items"], queryFn: listItems, staleTime: 30_000 }).data ?? [];
  const cats = useQuery({ queryKey: ["item-categories"], queryFn: listCategories, staleTime: 30_000 }).data ?? [];
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const inv = () => void qc.invalidateQueries({ queryKey: ["catalog-items"] });
  const save = async (name: string, desc: string, price: number, categoryId: string | null) => {
    if (editing) await updateItem(editing.id, name, desc, price, categoryId);
    else await createItem(name, desc, price, categoryId);
    setEditing(null);
    inv();
  };
  const rm = async (id: string) => { await deleteItem(id); inv(); };
  return (
    <div className="space-y-3">
      <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})` }}>{t(lang, "cf.sku")}</h4>
      <SkuCategoryBar lang={lang} accent={accent} />
      <SkuFormCard key={editing?.id ?? "new"} lang={lang} cats={cats} editing={editing} onSave={save} onCancel={() => setEditing(null)} />
      {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "sku.empty")}</p> : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {items.map((it) => <SkuItemCard key={it.id} lang={lang} item={it} accent={accent} onEdit={() => setEditing(it)} onDelete={() => void rm(it.id)} />)}
        </div>
      )}
    </div>
  );
}
