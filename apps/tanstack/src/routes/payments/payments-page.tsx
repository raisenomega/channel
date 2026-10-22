/**
 * HUB by Raisen — Pagina de Pagos: pagos como filas (RowList global); clic abre el PDF "PAGO".
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarPagos, type PaymentListItem } from "@/lib/payments-client";
import { Card, CardBody } from "@/components/ui/card";
import { RowList } from "@/components/ui/row-list";
import { PaymentRow } from "./payment-row";
import { OrderPdfModal } from "@/routes/quotes/pdf/order-pdf-modal";

export function PaymentsPage() {
  const { language } = usePreferences();
  const [pdf, setPdf] = useState<PaymentListItem | null>(null);
  const { data, isPending } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => { const r = await listarPagos(); return r.ok ? r.value : []; },
    staleTime: 30_000,
  });

  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "payments.title")}</h2>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t(language, "common.loading")}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardBody className="py-8 text-center"><p className="text-sm text-muted-foreground">{t(language, "payments.empty")}</p></CardBody></Card>
      ) : (
        <RowList items={data} renderRow={(p) => <PaymentRow key={p.id} lang={language} payment={p} onOpen={setPdf} />} />
      )}

      {pdf && pdf.orderId && <OrderPdfModal lang={language} orderId={pdf.orderId} total={pdf.amount} title={t(language, "payments.pdfTitle")} onClose={() => setPdf(null)} />}
    </div>
  );
}
