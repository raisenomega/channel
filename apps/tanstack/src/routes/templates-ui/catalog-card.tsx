/**
 * HUB by Raisen — Tarjeta de plantilla del catalogo (estilo Borradores). Muestra nombre + categoria +
 * contenido real + estado REAL de Meta (Aprobada/En revision/Rechazada/sin enviar) + boton Usar. C4 <=75.
 */
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "./template-catalog";

const BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  APPROVED: { bg: "hsl(145 60% 45% / 0.18)", fg: "hsl(145 55% 42%)", label: "Aprobada" },
  PENDING: { bg: "hsl(45 90% 55% / 0.2)", fg: "hsl(40 85% 48%)", label: "En revision" },
  REJECTED: { bg: "hsl(0 72% 55% / 0.18)", fg: "hsl(0 72% 55%)", label: "Rechazada" },
};

export function CatalogCard({ item, status, busy, onUsar }: {
  item: CatalogItem;
  status: string | undefined;
  busy: boolean;
  onUsar: (i: CatalogItem) => void;
}) {
  const b = status ? BADGE[status] : undefined;
  const cuerpo = item.imp ? "Plantilla pre-aprobada de Meta (contenido oficial)." : item.body;
  const aprobada = status === "APPROVED";
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3">
      <div className="flex items-start justify-between gap-1">
        <strong className="truncate text-sm text-foreground">{item.name}</strong>
        {b
          ? <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: b.bg, color: b.fg }}>{b.label}</span>
          : <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground" style={{ background: "hsl(var(--muted) / 0.3)" }}>sin enviar</span>}
      </div>
      <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.cat}{item.imp ? " - meta" : ""}</span>
      <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-[11px] text-muted-foreground">{cuerpo}</p>
      <Button variant={aprobada ? "ghost" : "outline"} size="sm" loading={busy}
        onClick={() => onUsar(item)}>{aprobada ? "Usar en Canales" : "Usar"}</Button>
    </div>
  );
}
