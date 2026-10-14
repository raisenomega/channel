/**
 * HUB by Raisen — Integraciones (/settings/integrations).
 * Lista de integraciones disponibles del ecosistema (NUCLEO, OMEGA, POS,
 * TABLE, HEALTH, HOME, FLEET) con icono, nombre y estado real desde
 * `integration_configs`. Sin datos mock: si no hay configuraciones, se
 * muestra un estado vacío honesto (N5) "Disponible con plan Ecosystem".
 */
import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import {
  listarIntegraciones,
  toggleIntegracion,
  TIPO_INTEGRACION,
  type Integration,
  type IntegrationType,
} from "@/lib/integrations-client";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const IntegrationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/integrations",
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { language } = usePreferences();
  const [pendiente, setPendiente] = useState(false);
  const [syncErr, setSyncErr] = useState(false);

  const { data, isPending, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const r = await listarIntegraciones();
      if (!r.ok) {
        setSyncErr(true);
        return [];
      }
      setSyncErr(false);
      return r.value;
    },
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <div className="view">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          {t(language, "integrations.title")}
        </h2>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      </div>
    );
  }

  const integraciones = data ?? [];
  const porTipo = new Map(integraciones.map((i) => [i.type, i]));
  const conectadas = integraciones.filter((i) => i.isActive).length;

  return (
    <div className="view">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {t(language, "integrations.title")}
        </h2>
        <Link
          to="/settings"
          className="text-sm text-primary hover:text-primary-hover"
        >
          {t(language, "common.back")}
        </Link>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            {t(language, "integrations.title")}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {conectadas} {t(language, "integrations.count")}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {syncErr ? (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl glass-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t(language, "integrations.syncError")}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t(language, "common.retry")}
          </Button>
        </div>
      ) : null}

      {integraciones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl glass-card p-6 text-center">
          <span className="text-dim">
            <IntegrationIcon kind="fleet" className="size-8" />
          </span>
          <p className="text-sm font-medium text-foreground">
            {t(language, "integrations.empty")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(language, "integrations.emptyBody")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {TIPO_INTEGRACION.map((tipo) => {
            const integracion = porTipo.get(tipo);
            const activa = integracion?.isActive ?? false;
            const configurada = Boolean(integracion);
            return (
              <IntegracionItem
                key={tipo}
                language={language}
                tipo={tipo}
                activa={activa}
                configurada={configurada}
                pendiente={pendiente}
                onToggle={(v) => void onToggle(integracion, v, setPendiente)}
              />
            );
          })}
        </div>
      )}

      {pendiente ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {t(language, "integrations.pending")}
        </p>
      ) : null}
    </div>
  );
}

function IntegracionItem({
  language,
  tipo,
  activa,
  configurada,
  pendiente,
  onToggle,
}: {
  language: Parameters<typeof t>[0];
  tipo: IntegrationType;
  activa: boolean;
  configurada: boolean;
  pendiente: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Card className={configurada ? "" : "opacity-80"}>
      <div className="flex items-center gap-3">
        <span className="text-primary">
          <IntegrationIcon kind={tipo} className="size-6" />
        </span>
        <div className="flex-1">
          <CardTitle className="text-sm">
            {t(language, "integrations." + tipo)}
          </CardTitle>
        </div>
      </div>

      <CardHeader className="mb-0 mt-3 flex items-center justify-between">
        <Badge tone={activa ? "success" : "warn"} dot>
          {t(language, activa ? "integrations.active" : "integrations.inactive")}
        </Badge>
        <Switch
          checked={activa}
          disabled={!configurada || pendiente}
          onChange={onToggle}
        />
      </CardHeader>
    </Card>
  );
}

async function onToggle(
  integracion: Integration | undefined,
  v: boolean,
  setPendiente: (v: boolean) => void,
) {
  if (!integracion) return;
  setPendiente(true);
  await toggleIntegracion(integracion.id, v);
  setPendiente(false);
}
