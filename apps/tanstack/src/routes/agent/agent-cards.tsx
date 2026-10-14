/**
 * HUB by Raisen — Tarjetas de configuración de la página Agente IA.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { AgentMetrics } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { AutonomySwitchRow, ESCALATION_ITEMS, KvRow, SectionTitle } from "./agent-shared";
import { ProviderSelector } from "./agent-provider";

export function ProviderConfigCard({ language, metrics, hasError }: {
  language: Idioma;
  metrics: AgentMetrics | null;
  hasError: boolean;
}) {
  return (
    <>
      <SectionTitle label={t(language, "agent.providerConfig")} />
      <Card className="mb-4">
        <CardBody>
          {ProviderSelector(language)}
          <div className="mt-4 space-y-3">
            {metrics && !hasError ? (
              <>
                <KvRow label={t(language, "agent.activeProvider")} value={metrics.providerName} highlight />
                <KvRow label={t(language, "agent.model")} value={metrics.modelName} />
                <KvRow label={t(language, "agent.byok")} value={metrics.byokConfigured ? t(language, "agent.byokTenant") : t(language, "agent.byokRaisen")} />
                <KvRow label={t(language, "agent.fallback")} value={metrics.fallbackProvider ?? t(language, "agent.fallbackNone")} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t(language, "common.noData")}</p>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export function AutonomyCard({ language }: { language: Idioma }) {
  return (
    <>
      <SectionTitle label={t(language, "agent.autonomy")} />
      <Card className="mb-4">
        <CardBody>
          <AutonomySwitchRow label={t(language, "agent.outOfHours")} defaultOn />
          <AutonomySwitchRow label={t(language, "agent.frequentInHours")} defaultOn />
          <AutonomySwitchRow label={t(language, "agent.quotesOrders")} defaultOn={false} />
        </CardBody>
      </Card>
    </>
  );
}

export function EscalateCard({ language }: { language: Idioma }) {
  return (
    <>
      <SectionTitle label={t(language, "agent.alwaysEscalate")} />
      <Card className="mb-4">
        <div className="divide-y divide-border/30">
          {ESCALATION_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="text-foreground">{t(language, item.key)}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}