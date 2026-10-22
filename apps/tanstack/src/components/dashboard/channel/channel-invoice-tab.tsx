/**
 * HUB by Raisen — Pestana "Factura" del panel de canal: facturas del contacto del hilo como filas
 * (RowList global). Las facturas se crean al convertir una cotizacion. C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchInvoicesForContact } from "@/lib/invoices-client";
import { RowList } from "@/components/ui/row-list";

export function ChannelInvoiceTab({ lang, contactId }: { lang: Idioma; contactId: string }) {
  const q = useQuery({ queryKey: ["invoices-contact", contactId], queryFn: () => fetchInvoicesForContact(contactId), enabled: !!contactId, staleTime: 20_000 });
  const rows = q.data ?? [];
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{t(lang, "invoices.empty")}</p>;
  return (
    <RowList items={rows} renderRow={(i) => (
      <div key={i.id} className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2">
        <span className="w-16 shrink-0 text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" })}</span>
        <span className="flex-1 truncate text-sm font-medium text-foreground">{i.clientName || "—"}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{i.total.toFixed(2)}</span>
        <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(lang, "invoices.status." + i.status)}</span>
      </div>
    )} />
  );
}
