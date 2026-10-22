/**
 * HUB by Raisen — Fila de Orden (RowList global): fecha + total + estado Pendiente/Pagado/Cancelado.
 * Clic en la fila abre el PDF "ORDEN"; los botones de estado no disparan el PDF (stopPropagation). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { OrderListItem } from "@/lib/orders-client";

export function OrderRow({ lang, order, onStatus, onOpen }: {
  lang: Idioma; order: OrderListItem; onStatus: (id: string, status: string) => void; onOpen: (o: OrderListItem) => void;
}) {
  const fecha = new Date(order.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" });
  return (
    <div onClick={() => onOpen(order)} className="flex w-full cursor-pointer items-center gap-3 border-b border-border/30 px-3 py-2 hover:bg-muted/30">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{fecha}</span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">{order.currency} {order.totalAmount.toFixed(2)}</span>
      <div className="flex shrink-0 gap-1">
        {["pending", "paid", "cancelled"].map((s) => (
          <button key={s} type="button" className={"chip text-[11px]" + (order.status === s ? " active" : "")} onClick={(e) => { e.stopPropagation(); onStatus(order.id, s); }}>{t(lang, "orders.status." + s)}</button>
        ))}
      </div>
    </div>
  );
}
