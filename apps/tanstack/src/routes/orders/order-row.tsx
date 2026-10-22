/**
 * HUB by Raisen — Fila de Orden (RowList global, estilo Agendados): fecha + total + botones de estado
 * Pendiente/Pagado/Cancelado (el activo resaltado). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { OrderListItem } from "@/lib/orders-client";

export function OrderRow({ lang, order, onStatus }: {
  lang: Idioma; order: OrderListItem; onStatus: (id: string, status: string) => void;
}) {
  const fecha = new Date(order.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" });
  return (
    <div className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{fecha}</span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">{order.currency} {order.totalAmount.toFixed(2)}</span>
      <div className="flex shrink-0 gap-1">
        {["pending", "paid", "cancelled"].map((s) => (
          <button key={s} type="button" className={"chip text-[11px]" + (order.status === s ? " active" : "")} onClick={() => onStatus(order.id, s)}>{t(lang, "orders.status." + s)}</button>
        ))}
      </div>
    </div>
  );
}
