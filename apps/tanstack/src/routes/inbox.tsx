/**
 * HUB by Raisen — Ultra-Dashboard /inbox (BentoBox glass). Sin datos mock (N5).
 */
import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { CANALES, calcularStats, fetchInbox } from "./inbox/inbox-mappers";
import { FiltersBar } from "./inbox/inbox-sections";
import { ConversationList } from "./inbox/inbox-list";
import { KpiRow, WidgetsRow } from "./inbox/inbox-widgets";
import { BentoRowNueva } from "@/components/dashboard/bentobox/bento-row-nueva";
import { useRecentActivity } from "@/hooks/useRecentActivity";

const InboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: InboxPage,
});

function InboxPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroSLA, setFiltroSLA] = useState<boolean | null>(null);
  const { data: items, isPending } = useQuery({ queryKey: ["inbox"], queryFn: fetchInbox, staleTime: 30_000 });
  // Hooks SIEMPRE antes del early return (React rules-of-hooks).
  const { events } = useRecentActivity();

  const itemsFiltrados = (items ?? []).filter((i) => {
    if (filtroEstado && i.status !== filtroEstado) return false;
    if (filtroSLA === true && !i.slaViolated) return false;
    return true;
  });

  const stats = calcularStats(itemsFiltrados);
  const canalesActivos = CANALES.filter((c) => stats.porCanal[c] !== undefined);

  const toggleEstado = (e: string) => setFiltroEstado(filtroEstado === e ? null : e);
  const toggleSLA = () => setFiltroSLA(filtroSLA === true ? null : true);
  const cleanFilters = () => { setFiltroEstado(null); setFiltroSLA(null); };
  const handleOpenOnboarding = () => void navigate({ to: "/onboarding/tenant" });
  const sinDatos = items === undefined || items.length === 0;

  if (isPending) {
    return (
      <div className="view">
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t(language, "inbox.active")}…</div>
      </div>
    );
  }

  return (
    <div className="view">
      <KpiRow language={language} stats={stats} total={items?.length ?? 0} />
      <WidgetsRow language={language} stats={stats} items={itemsFiltrados} sinDatos={sinDatos} />
      <BentoRowNueva lang={language} onOpen={handleOpenOnboarding} events={events} />
      <FiltersBar
        language={language} canalesActivos={canalesActivos}
        filtroEstado={filtroEstado} filtroSLA={filtroSLA}
        onEstado={toggleEstado} onSLA={toggleSLA} onClean={cleanFilters}
        onCanalNav={(c) => void navigate({ to: "/channels/$channelId", params: { channelId: c } })}
      />
      <ConversationList
        language={language} items={itemsFiltrados}
        onOpen={(id) => void navigate({ to: "/inbox/" + encodeURIComponent(id) })}
        onGoChannels={() => void navigate({ to: "/channels" })}
      />
    </div>
  );
}

export { InboxRoute };
