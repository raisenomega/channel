/**
 * HUB by Raisen — Canales (/channels). Sin datos mock (N5).
 * Hotfix L-2: el CATALOGO (9 cards) se renderiza SIEMPRE, con o sin tenant.
 * Ningun estado de error saca al usuario de /channels (ver redirect-on-error L-1).
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { CATALOGO } from "./channels-ui/channels-data";
import { useCanales } from "./channels-ui/channels-fetchers";
import { ChannelCard } from "./channels-ui/channel-card";
import { ChannelsNotice, LoadingNotice } from "./channels-ui/channels-notices";
import { FacebookPagePicker } from "./channels-ui/facebook-page-picker";
import { useOauthRelay } from "./channels-ui/use-oauth-relay";

export const ChannelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels",
  component: ChannelsPage,
});

function ChannelsPage() {
  const { language } = usePreferences();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [fbPicker, setFbPicker] = useState(false);
  const { data, isPending, errKind, refetch } = useCanales();

  // O-3/O-4: relay del popup OAuth (BroadcastChannel). P1: el verde solo del fetch real.
  useOauthRelay(refetch, setFbPicker);

  if (isPending) return <LoadingNotice language={language} />;

  const canales = data ?? [];
  const porKind = new Map(canales.map((c) => [c.kind, c]));
  const sinTenant = errKind === "config_incompleta";

  return (
    <div className="view">
      <h2 className="mb-1 text-lg font-bold text-foreground">
        {t(language, "channels.connected")}
      </h2>

      <ChannelsNotice
        language={language}
        errKind={errKind}
        vacio={canales.length === 0}
        onRetry={() => void refetch()}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {CATALOGO.map((kind) => (
          <ChannelCard
            key={kind}
            language={language}
            kind={kind}
            canal={porKind.get(kind)}
            esAbierto={abierto === kind}
            onToggleExpand={() => setAbierto(abierto === kind ? null : kind)}
            disabled={sinTenant}
          />
        ))}
      </div>

      {fbPicker ? (
        <FacebookPagePicker language={language} onClose={() => setFbPicker(false)}
          onConnected={() => { setFbPicker(false); void refetch(); }} />
      ) : null}
    </div>
  );
}
