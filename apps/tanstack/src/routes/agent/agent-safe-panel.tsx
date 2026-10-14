/**
 * HUB by Raisen — Panel SAFE de gobernanza del Agente IA.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { SafeStats } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./agent-shared";

function SafeKpi({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-bold", className ?? "text-foreground")}>{value}</p>
    </div>
  );
}

export function SafePanel({ safe, language }: { safe: SafeStats | null; language: Idioma }) {
  return (
    <div className="mt-2">
      <SectionTitle label={t(language, "safe.title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t(language, "safe.autonomy")}</CardTitle>
          {safe?.isKillSwitched ? (
            <Badge tone="danger" dot>{t(language, "safe.killSwitchOn")}</Badge>
          ) : (
            <Badge tone="success" dot>{t(language, "safe.killSwitchOff")}</Badge>
          )}
        </CardHeader>
        <CardBody>
          <div className="safe-row flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">
              {safe && !safe.sinDatos
                ? safe.isKillSwitched
                  ? t(language, "safe.killSwitchOn")
                  : `${t(language, "safe.phaseLabel").replace("{fase}", String(safe.currentPhase))}`
                : t(language, "safe.noAutonomy")}
            </span>
            <span className="safe-phases">
              {[0, 1, 2, 3, 4].map((n) => (
                <span key={n} className={cn("safe-step", safe && !safe.sinDatos && n <= safe.currentPhase && "on")}>
                  {n}
                </span>
              ))}
            </span>
          </div>
          {safe?.killSwitchReason && <p className="mb-3 text-xs text-critical">{safe.killSwitchReason}</p>}
          {safe && !safe.sinDatos ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SafeKpi label={t(language, "safe.totalEvals")} value={String(safe.totalEvaluaciones)} />
              <SafeKpi label={t(language, "safe.disagreementAvg")} value={safe.disagreementAvgPct !== null ? `${safe.disagreementAvgPct.toFixed(1)}%` : t(language, "safe.noDisagreement")} className="text-warn" />
              <SafeKpi label={t(language, "safe.approved")} value={String(safe.approved)} className="text-success" />
              <SafeKpi label={t(language, "safe.abstained")} value={String(safe.abstained)} className="text-warn" />
              <SafeKpi label={t(language, "safe.blocked")} value={String(safe.blocked)} className="text-critical" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t(language, "safe.empty")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}