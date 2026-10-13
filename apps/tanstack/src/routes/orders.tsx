/**
 * HUB by Raisen — Pagina de Ordenes (/orders).
 * Lista de ordenes vinculadas a cotizaciones.
 * Datos reales desde tabla orders via Supabase REST.
 */
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarOrdenes } from "@/lib/orders-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const OrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

const STATUS_TONE: Record<string, "warn" | "hub" | "success" | "process" | "danger"> = {
  pending: "warn", confirmed: "hub", paid: "success",
  shipped: "process", delivered: "success", cancelled: "danger",
};

function OrdersPage() {
  const { language } = usePreferences();

  const { data, isPending } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const r = await listarOrdenes();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

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
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}