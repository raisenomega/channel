/**
 * HUB by Raisen — Fila de widgets del dashboard /inbox (distribución, SLA, pendientes).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { InboxItem, DashboardStats } from "@/lib/types";
import { BentoTitle, BentoKpi, DistribucionCanales, AnilloSLA, Pendientes } from "@/components/dashboard/bentobox-dashboard";
import { IconBars, IconDona, IconFlag } from "./inbox-icons";

export function KpiRow({ language, stats, total, tenantName, tenantPlan }: {
  language: Idioma;
  stats: DashboardStats;
  total: number;
  tenantName?: string;
  tenantPlan?: string;
}) {
  return (
    <div className="bento">
      <BentoKpi label={t(language, "kpi.tenant")} num={tenantName || "—"} unit={tenantPlan || t(language, "dash.plan")} />
      <BentoKpi label={t(language, "dash.activas")} num={stats.abiertas} trend={t(language, "dash.vivas")} />
      <BentoKpi label={t(language, "dash.sinAsignar")} num={stats.sinAsignar} trend={t(language, "dash.pend.asignar")} down />
      <BentoKpi label={t(language, "inbox.total")} num={total} unit={t(language, "inbox.min")} />
    </div>
  );
}

export function WidgetsRow({ language, stats, items, sinDatos }: {
  language: Idioma;
  stats: DashboardStats;
  items: readonly InboxItem[];
  sinDatos: boolean;
}) {
  const emp = <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>;
  return (
    <div className="bento mt-4">
      <div className="bento-card bento-col-4">
        <BentoTitle icon={<IconBars />} label={t(language, "dash.distribucion")} />
        {sinDatos ? emp : <DistribucionCanales stats={stats} lang={language} />}
      </div>
      <div className="bento-card bento-col-4">
        <BentoTitle icon={<IconDona />} label={t(language, "dash.slaTitulo")} />
        {sinDatos ? emp : <AnilloSLA items={items} lang={language} />}
      </div>
      <div className="bento-card bento-col-4">
        <BentoTitle icon={<IconFlag />} label={t(language, "dash.pendientes")} />
        {sinDatos ? emp : <Pendientes items={items} lang={language} />}
      </div>
    </div>
  );
}