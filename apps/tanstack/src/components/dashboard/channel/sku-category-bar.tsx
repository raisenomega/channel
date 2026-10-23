/**
 * HUB by Raisen — Barra de categorias del SKU: chips + [+] (input corto, Enter guarda) + [x] borra. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { listCategories, createCategory, deleteCategory } from "@/lib/items-client";

export function SkuCategoryBar({ lang, accent }: { lang: Idioma; accent: string }) {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["item-categories"], queryFn: listCategories, staleTime: 30_000 }).data ?? [];
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const inv = () => void qc.invalidateQueries({ queryKey: ["item-categories"] });
  const save = async () => { const n = name.trim(); setName(""); setAdding(false); if (n) { await createCategory(n); inv(); } };
  const rm = async (id: string) => { await deleteCategory(id); inv(); };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {cats.map((c) => (
        <span key={c.id} className="chip inline-flex items-center gap-1 text-[11px]">
          {c.name}
          <button type="button" onClick={() => void rm(c.id)} className="text-destructive" aria-label="x">{"×"}</button>
        </span>
      ))}
      {adding ? (
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") { setName(""); setAdding(false); } }} onBlur={() => void save()} placeholder={t(lang, "sku.catName")} className="rounded border border-border/55 bg-card-soft p-1 text-[11px] text-foreground" style={{ width: 120 }} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="chip text-[11px] font-bold" style={{ color: `hsl(${accent})` }}>+</button>
      )}
    </div>
  );
}
