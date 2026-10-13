/**
 * HUB by Raisen — Pagina de Reportes (/reports).
 * KPIs agregados: total conversaciones, mensajes, tasa de cierre, was_correct promedio.
 * Datos reales desde queries a conversations, messages, agent_interactions.
 */
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { fetchReportKpis } from "@/lib/reports-client";
import { Card, CardBody } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";

export const ReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});

function ReportsPage() {
  const { language } = usePreferences();

  const { data, isPending } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const r = await fetchReportKpis();
      return r.ok ? r.value : null;
    },
    staleTime: 30_000,
  });

  return (
    <div className="view space-y-4">
      <h2 className="text-lg font-bold text-foreground">{t(language, "reports.title")}</h2>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : !data ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "reports.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi
              label={t(language, "reports.totalConversations")}
              value={String(data.totalConversations)}
            />
            <Kpi
              label={t(language, "reports.totalMessages")}
              value={String(data.totalMessages)}
            />
            <Kpi
              label={t(language, "reports.closeRate")}
              value={data.closeRate !== null ? `${data.closeRate.toFixed(1)}%` : "—"}
            />
            <Kpi
              label={t(language, "reports.wasCorrectAvg")}
              value={data.wasCorrectAvg !== null ? `${data.wasCorrectAvg.toFixed(1)}%` : "—"}
            />
          </div>
        </>
      )}
    </div>
  );
}