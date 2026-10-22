/**
 * HUB by Raisen — Pagina de Ordenes: pedidos como filas (RowList global) con estado editable.
 */
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarOrdenes, setOrderStatus } from "@/lib/orders-client";
import { Card, CardBody } from "@/components/ui/card";
import { RowList } from "@/components/ui/row-list";
import { OrderRow } from "./order-row";

export function OrdersPage() {
  const { language } = usePreferences();
  const { data, isPending, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => { const r = await listarOrdenes(); return r.ok ? r.value : []; },
    staleTime: 30_000,
  });
  const setStatus = async (id: string, status: string) => { await setOrderStatus(id, status); void refetch(); };

  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "orders.title")}</h2>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t(language, "common.loading")}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardBody className="py-8 text-center"><p className="text-sm text-muted-foreground">{t(language, "orders.empty")}</p></CardBody></Card>
      ) : (
        <RowList items={data} renderRow={(o) => <OrderRow key={o.id} lang={language} order={o} onStatus={(id, s) => void setStatus(id, s)} />} />
      )}
    </div>
  );
}
