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
      <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(payment); }} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t(lang, "quotes.download")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      </button>
    </div>
  );
}
