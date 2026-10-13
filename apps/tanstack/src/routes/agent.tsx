import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Kpi } from "@/components/ui/kpi";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeBoard } from "@/components/layout/safe-board";

export const AgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent",
  component: AgentPage,
});

function AgentPage() {
  const { language } = usePreferences();

  return (
    <div className="view">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "agent.title")}
      </h2>

      <div className="kpis">
        <Kpi label={t(language, "agent.wasCorrect")} value="92%" />
        <Kpi label={t(language, "agent.indistinguishability")} value="78%" />
        <Kpi label={t(language, "agent.autoResolve")} value="64%" />
        <Kpi label={t(language, "agent.latency")} value="1.2s" />
      </div>

      <SafeBoard />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t(language, "agent.providerConfig")}</CardTitle>
        </CardHeader>
        <div className="am p-3">
          <b className="font-display text-lg font-extrabold text-foreground">GPT-4o</b>
          <small className="text-xs text-muted-foreground">OpenAI</small>
        </div>
      </Card>
    </div>
  );
}