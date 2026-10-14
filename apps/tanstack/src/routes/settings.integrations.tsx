/**
 * HUB by Raisen — Integraciones (/settings/integrations).
 * Lista de integraciones disponibles del ecosistema (NUCLEO, OMEGA, POS,
 * TABLE, HEALTH, HOME, FLEET) con icono, nombre y estado real desde
 * `integration_configs`. Sin datos mock: si no hay configuraciones, se
 * muestra un estado vacio honesto (N5) "Disponible con plan Ecosystem".
 */
import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { TIPO_INTEGRACION } from "@/lib/integrations-client";
import type { IntegrationType } from "@/lib/integrations-client";
import { useIntegraciones, onToggle } from "./settings-integrations/integration-fetchers";
import { IntegracionItem } from "./settings-integrations/integration-item";
import { LoadingState, ErrorBanner, EmptyState, CounterBadge } from "./settings-integrations/integration-panels";

export const IntegrationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/integrations",
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { language } = usePreferences();
  const [pendiente, setPendiente] = useState(false);
  const { data, isPending, syncErr, refetch } = useIntegraciones();

  if (isPending) return <LoadingState language={language} />;

  const integraciones = data ?? [];
  const porTipo = new Map(integraciones.map((i) => [i.type, i]));
  const conectadas = integraciones.filter((i) => i.isActive).length;

  return (
    <div className="view">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t(language, "integrations.title")}</h2>
        <Link to="/settings" className="text-sm text-primary hover:text-primary-hover">
          {t(language, "common.back")}
        </Link>
      </div>

      <CounterBadge language={language} count={conectadas} />

      {syncErr ? <ErrorBanner language={language} onRetry={() => void refetch()} /> : null}

      {integraciones.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {TIPO_INTEGRACION.map((tipo: IntegrationType) => {
            const integracion = porTipo.get(tipo);
            return (
              <IntegracionItem
                key={tipo}
                language={language}
                tipo={tipo}
                activa={integracion?.isActive ?? false}
                configurada={Boolean(integracion)}
                pendiente={pendiente}
                onToggle={(v) => void onToggle(integracion, v, setPendiente)}
              />
            );
          })}
        </div>
      )}

      {pendiente ? (
        <p className="mt-4 text-xs text-muted-foreground">{t(language, "integrations.pending")}</p>
      ) : null}
    </div>
  );
}