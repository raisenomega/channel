/**
 * HUB by Raisen — Pagina de Ordenes (componente principal).
 */
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarOrdenes, setOrderStatus } from "@/lib/orders-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_TONE, Row } from "./orders-utils";

export function OrdersPage() {
  const { language } = usePreferences();

  const { data, isPending, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const r = await listarOrdenes();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });
  const setStatus = async (id: string, status: string) => { await setOrderStatus(id, status); void refetch(); };

  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "orders.title")}</h2>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "orders.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((o) => (
            <Card key={o.id}>
              <CardHeader>
                <CardTitle className="text-sm">{t(language, "orders.total")}: {o.currency} {o.totalAmount.toFixed(2)}</CardTitle>
                <Badge tone={STATUS_TONE[o.status] ?? "warn"}>
                  {t(language, "orders.status." + o.status)}
                </Badge>
              </CardHeader>
              <CardBody>
                <Row label={t(language, "orders.quote")} value={o.quoteId ? o.quoteId.slice(0, 8) + "..." : "—"} />
                <Row label={t(language, "orders.contact")} value={o.contactId ?? "—"} />
                <Row label={t(language, "orders.date")} value={new Date(o.createdAt).toLocaleDateString()} />
                <div className="mt-2 flex gap-1">
                  {["pending", "paid", "cancelled"].map((s) => (
                    <button key={s} type="button" className={"chip text-xs" + (o.status === s ? " active" : "")} onClick={() => void setStatus(o.id, s)}>{t(language, "orders.status." + s)}</button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}