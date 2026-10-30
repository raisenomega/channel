/**
 * HUB by Raisen — Fila de widgets del dashboard /inbox (distribución, SLA, pendientes).
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { InboxItem, DashboardStats } from "@/lib/types";
import { fetchKpiCounts } from "@/lib/reports-client";
import { BentoTitle, BentoKpi, DistribucionCanales, AnilloSLA, Pendientes } from "@/components/dashboard/bentobox-dashboard";
import { IconBars, IconDona, IconFlag } from "./inbox-icons";

export function KpiRow({ language, stats, total }: {
  language: Idioma;
  stats: DashboardStats;
  total: number;
}) {
  // COUNT REAL del tenant (no la muestra de 50 del inbox). Fallback a la muestra mientras carga.
  const { data } = useQuery({ queryKey: ["kpi-counts"], queryFn: fetchKpiCounts, staleTime: 30_000, refetchInterval: 30_000 });
  return (
    <div className="bento">
      {/* Balance: cero honesto (sin endpoint de balance/finanzas aún); el nombre del negocio vive en la barra WhatsApp. */}
      <BentoKpi label={t(language, "kpi.balance")} num="0" />
      <BentoKpi label={t(language, "dash.activas")} num={data?.abiertas ?? stats.abiertas} trend={t(language, "dash.vivas")} />
      <BentoKpi label={t(language, "dash.sinAsignar")} num={data?.sinAsignar ?? stats.sinAsignar} trend={t(language, "dash.pend.asignar")} down />
      <BentoKpi label={t(language, "inbox.total")} num={data?.total ?? total} unit={t(language, "inbox.min")} />
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