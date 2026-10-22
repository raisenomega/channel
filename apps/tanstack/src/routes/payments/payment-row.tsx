/**
 * HUB by Raisen — Fila de Pago (RowList global): fecha + monto + estado. Clic abre el PDF "PAGO"
 * (reusa el PDF de la orden enlazada). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { PaymentListItem } from "@/lib/payments-client";

export function PaymentRow({ lang, payment, onOpen }: {
  lang: Idioma; payment: PaymentListItem; onOpen: (p: PaymentListItem) => void;
}) {
  const fecha = new Date(payment.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" });
  return (
    <div onClick={() => onOpen(payment)} className="flex w-full cursor-pointer items-center gap-3 border-b border-border/30 px-3 py-2 hover:bg-muted/30">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{fecha}</span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">{payment.currency} {payment.amount.toFixed(2)}</span>
      <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(lang, "payments.status." + payment.status)}</span>
    </div>
  );
}
