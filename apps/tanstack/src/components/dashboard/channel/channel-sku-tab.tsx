/**
 * HUB by Raisen — Pestana SKU: catalogo de items (servicios/productos) por negocio. Alta + lista +
 * borrar. Se usan luego en las lineas de cotizacion/factura (dropdown [item]). C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { listItems, createItem, deleteItem } from "@/lib/items-client";

const INP = "rounded border border-border/55 bg-card-soft p-1.5 text-sm text-foreground";

export function ChannelSkuTab({ lang, accent }: { lang: Idioma; accent: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["catalog-items"], queryFn: listItems, staleTime: 30_000 });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("servicio");
  const [busy, setBusy] = useState(false);
  const rows = q.data ?? [];
  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const id = await createItem(name.trim(), desc.trim(), Number(price) || 0, type);
    setBusy(false);
    if (id) { setName(""); setDesc(""); setPrice(""); void qc.invalidateQueries({ queryKey: ["catalog-items"] }); }
  };
  const rm = async (id: string) => { await deleteItem(id); void qc.invalidateQueries({ queryKey: ["catalog-items"] }); };
  return (
    <div className="space-y-3">
      <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})` }}>{t(lang, "cf.sku")}</h4>
      <div className="grid grid-cols-12 gap-1">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(lang, "sku.name")} className={`${INP} col-span-4`} />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t(lang, "sku.desc")} className={`${INP} col-span-4`} />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t(lang, "sku.price")} className={`${INP} col-span-2`} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${INP} col-span-2`}>
          <option value="servicio">{t(lang, "sku.service")}</option>
          <option value="producto">{t(lang, "sku.product")}</option>
        </select>
      </div>
      <button type="button" onClick={() => void add()} disabled={busy || !name.trim()} className="chip text-xs font-bold">+ {t(lang, "sku.add")}</button>
      {rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "sku.empty")}</p> : (
        <ul className="divide-y divide-border/30">
          {rows.map((it) => (
            <li key={it.id} className="flex items-center gap-2 py-1.5">
              <span className="flex-1 truncate text-sm text-foreground">{it.name}{it.description ? ` — ${it.description}` : ""}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{it.unitPrice.toFixed(2)}</span>
              <button type="button" onClick={() => void rm(it.id)} className="shrink-0 text-destructive" aria-label={t(lang, "quotes.cancel")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
