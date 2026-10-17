/**
 * HUB by Raisen — Página de Agente IA (OMEGA).
 * Componentes extraídos bajo routes/agent/ (C4 ≤75 líneas). Datos reales via
 * TanStack Query → Supabase REST. Sin datos mock (N5).
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMetrics, getSafeStats, type Result } from "@/lib/agent-client";
import type { AgentMetrics, SafeStats } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { ErrorCard } from "./agent/agent-shared";
import { KpiGrid } from "./agent/agent-kpi-grid";
import { ProviderConfigCard, AutonomyCard, EscalateCard } from "./agent/agent-cards";
import { SafePanel } from "./agent/agent-safe-panel";
import { AgentHeader } from "./agent/agent-header";

export const AgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent",
  component: AgentPage,
});

const QKEY_METRICS = ["agent", "metrics"] as const;
const QKEY_SAFE = ["agent", "safe"] as const;

function AgentPage() {
  const { language } = usePreferences();
  const { data: metricsResult } = useSuspenseQuery<Result<AgentMetrics, Error>>({ queryKey: QKEY_METRICS, queryFn: getMetrics, refetchInterval: 30_000 });
  const { data: safeResult } = useSuspenseQuery<Result<SafeStats, Error>>({ queryKey: QKEY_SAFE, queryFn: getSafeStats, refetchInterval: 30_000 });

  const metrics: AgentMetrics | null = metricsResult.ok ? metricsResult.value : null;
  const safe: SafeStats | null = safeResult.ok ? safeResult.value : null;
  const metricsError = !metricsResult.ok ? metricsResult.error : null;
  const safeError = !safeResult.ok ? safeResult.error : null;

  return (
    <div className="view">
      <AgentHeader language={language} metrics={metrics} hasError={!!metricsError} />
      {metricsError ? (
        <ErrorCard message={t(language, "common.error")} detail={metricsError.message} />
      ) : metrics && metrics.totalInteractions > 0 ? (
        <KpiGrid metrics={metrics} language={language} />
      ) : metrics && metrics.totalInteractions === 0 ? (
        <Card className="mb-4">
          <CardBody className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "common.noData")}</p>
            <p className="text-xs text-dim mt-1">{t(language, "safe.empty")}</p>
          </CardBody>
        </Card>
      ) : null}
      <ProviderConfigCard language={language} metrics={metrics} hasError={!!metricsError} />
      <AutonomyCard language={language} />
      <EscalateCard language={language} />
      {safeError ? <ErrorCard message={t(language, "common.error")} detail={safeError.message} /> : <SafePanel safe={safe} language={language} />}
    </div>
  );
}