/**
 * HUB by Raisen — Pagina de Pagos (componente principal).
 */
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarPagos } from "@/lib/payments-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_TONE, Row } from "./payments-utils";

export function PaymentsPage() {
  const { language } = usePreferences();

  const { data, isPending } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const r = await listarPagos();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "payments.title")}</h2>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "payments.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-sm">{p.currency} {p.amount.toFixed(2)}</CardTitle>
                <Badge tone={STATUS_TONE[p.status] ?? "warn"}>
                  {t(language, "payments.status." + p.status)}
                </Badge>
              </CardHeader>
              <CardBody>
                <Row label={t(language, "payments.provider")} value={p.provider ?? "—"} />
                <Row label={t(language, "payments.order")} value={p.orderId ? p.orderId.slice(0, 8) + "..." : "—"} />
                <Row label={t(language, "payments.date")} value={new Date(p.createdAt).toLocaleDateString()} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}