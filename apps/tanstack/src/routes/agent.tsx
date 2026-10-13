/**
 * HUB by Raisen — Página de Agente IA (OMEGA).
 * KPIs reales, configuración de proveedor, panel SAFE,
 * paneles autónomos y lista "siempre escalar a humano".
 *
 * Todos los datos via TanStack Query → Supabase REST.
 * Sin datos mock (N5). Estado vacío honesto cuando no hay datos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMetrics, getSafeStats, type Result } from "@/lib/agent-client";
import type { AgentMetrics, SafeStats } from "@/lib/types";
import { Kpi } from "@/components/ui/kpi";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const AgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agent",
  component: AgentPage,
});

// ── Query keys ──────────────────────────────────────────────

const QKEY_METRICS = ["agent", "metrics"] as const;
const QKEY_SAFE = ["agent", "safe"] as const;

// ── Página principal ────────────────────────────────────────

function AgentPage() {
  const { language } = usePreferences();
  const { data: metricsResult } = useSuspenseQuery<Result<AgentMetrics, Error>>({
    queryKey: QKEY_METRICS,
    queryFn: getMetrics,
    refetchInterval: 30_000,
  });
  const { data: safeResult } = useSuspenseQuery<Result<SafeStats, Error>>({
    queryKey: QKEY_SAFE,
    queryFn: getSafeStats,
    refetchInterval: 30_000,
  });

  const metrics: AgentMetrics | null = metricsResult.ok ? metricsResult.value : null;
  const safe: SafeStats | null = safeResult.ok ? safeResult.value : null;
  const metricsError = !metricsResult.ok ? metricsResult.error : null;
  const safeError = !safeResult.ok ? safeResult.error : null;

  return (
    <div className="view">
      {/* ── Encabezado ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t(language, "agent.title")}</h2>
          {metrics && !metricsError ? (
            <span className="block text-xs text-muted-foreground">
              {t(language, "agent.providerLine")}: {metrics.providerName} · {t(language, "agent.model")}: {metrics.modelName}
              · {metrics.totalInteractions} interacciones
            </span>
          ) : null}
        </div>
      </div>

      {/* ── KPIs ── */}
      {metricsError ? (
        <ErrorCard message={t(language, "common.error")} />
      ) : metrics && metrics.totalInteractions > 0 ? (
        <KpiGrid metrics={metrics} language={language} />
      ) : metrics && metrics.totalInteractions === 0 ? (
        <Card className="mb-4">
          <CardBody className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "common.noData")}</p>
            <p className="text-xs text-dim mt-1">
              Las métricas aparecerán cuando el agente interactúe con clientes.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {/* ── Configuración del proveedor ── */}
      <SectionTitle label={t(language, "agent.providerConfig")} />
      <Card className="mb-4">
        <CardBody>
          {providerSelector(language)}
          <div className="mt-4 space-y-3">
            {metrics && !metricsError ? (
              <>
                <KvRow
                  label={t(language, "agent.activeProvider")}
                  value={metrics.providerName}
                  highlight
                />
                <KvRow label={t(language, "agent.model")} value={metrics.modelName} />
                <KvRow
                  label={t(language, "agent.byok")}
                  value={metrics.byokConfigured ? t(language, "agent.byokTenant") : t(language, "agent.byokRaisen")}
                />
                <KvRow
                  label={t(language, "agent.fallback")}
                  value={metrics.fallbackProvider ?? t(language, "agent.fallbackNone")}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t(language, "common.noData")}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Paneles autónomos ── */}
      <SectionTitle label={t(language, "agent.autonomy")} />
      <Card className="mb-4">
        <CardBody>
          <AutonomySwitchRow
            label={t(language, "agent.outOfHours")}
            defaultOn
          />
          <AutonomySwitchRow
            label={t(language, "agent.frequentInHours")}
            defaultOn
          />
          <AutonomySwitchRow
            label={t(language, "agent.quotesOrders")}
            defaultOn={false}
          />
        </CardBody>
      </Card>

      {/* ── Siempre escalar a humano ── */}
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

      {/* ── Panel SAFE ── */}
      {safeError ? (
        <ErrorCard message={t(language, "common.error")} />
      ) : (
        <SafePanel safe={safe} language={language} />
      )}
    </div>
  );
}

// ── Componentes internos ────────────────────────────────────

function KpiGrid({ metrics, language }: { metrics: AgentMetrics; language: Idioma }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi
        label={t(language, "agent.wasCorrect")}
        value={metrics.wasCorrectPct !== null ? `${metrics.wasCorrectPct.toFixed(1)}%` : "—"}
      />
      <Kpi
        label={t(language, "agent.indistinguishability")}
        value={metrics.indistinguishabilityPct !== null ? `${metrics.indistinguishabilityPct.toFixed(1)}%` : "—"}
      />
      <Kpi
        label={t(language, "agent.autoResolve")}
        value={metrics.autoResolvePct !== null ? `${metrics.autoResolvePct.toFixed(1)}%` : "—"}
      />
      <Kpi
        label={t(language, "agent.latency")}
        value={metrics.avgLatencyMs !== null ? `${metrics.avgLatencyMs.toFixed(0)}ms` : "—"}
      />
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  );
}

function KvRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

const PROVIDER_OPTIONS = [
  { value: "anthropic", labelKey: "common.anthropic", models: ["common.claude35", "common.gpt4o"] },
  { value: "deepseek", labelKey: "common.deepseek", models: ["common.deepseekChat", "common.qwenMax"] },
  { value: "qwen", labelKey: "common.qwen", models: ["common.qwenMax", "common.gpt4o"] },
] as const;

function providerSelector(language: Idioma) {
  const [selected, setSelected] = useState("anthropic");
  const [model, setModel] = useState("claude35");

  const current = PROVIDER_OPTIONS.find((p) => p.value === selected);
  const models = current?.models ?? [];

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-muted-foreground">{t(language, "agent.activeProvider")}</label>
      <div className="flex gap-2">
        {PROVIDER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSelected(opt.value); setModel(opt.models[0] ?? ""); }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              selected === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border/70",
            )}
          >
            {t(language, opt.labelKey)}
          </button>
        ))}
      </div>
      {models.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t(language, "agent.model")}:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-border/40 bg-transparent px-2 py-1 text-xs text-foreground"
          >
            {models.map((m) => (
              <option key={m} value={m}>{t(language, m)}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function AutonomySwitchRow({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn: boolean;
}) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onChange={setChecked} />
    </div>
  );
}

const ESCALATION_ITEMS = [
  { key: "agent.complaint" },
  { key: "agent.vip" },
  { key: "agent.amountThreshold" },
  { key: "agent.legal" },
  { key: "agent.askHuman" },
] as const;

function SafePanel({ safe, language }: { safe: SafeStats | null; language: Idioma }) {
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
          {/* Fases de autonomía */}
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
                <span
                  key={n}
                  className={cn(
                    "safe-step",
                    safe && !safe.sinDatos && n <= safe.currentPhase && "on",
                  )}
                >
                  {n}
                </span>
              ))}
            </span>
          </div>

          {safe?.killSwitchReason && (
            <p className="mb-3 text-xs text-critical">{safe.killSwitchReason}</p>
          )}

          {/* Métricas SAFE */}
          {safe && !safe.sinDatos ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SafeKpi
                label={t(language, "safe.totalEvals")}
                value={String(safe.totalEvaluaciones)}
              />
              <SafeKpi
                label={t(language, "safe.disagreementAvg")}
                value={
                  safe.disagreementAvgPct !== null
                    ? `${safe.disagreementAvgPct.toFixed(1)}%`
                    : t(language, "safe.noDisagreement")
                }
                className="text-warn"
              />
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

function SafeKpi({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-bold", className ?? "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  const { language } = usePreferences();
  return (
    <Card className="mb-4 border-critical/30">
      <CardBody className="flex flex-col items-center py-6 text-center">
        <p className="text-sm text-critical">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-background hover:bg-primary/90"
        >
          {t(language, "common.retry")}
        </button>
      </CardBody>
    </Card>
  );
}