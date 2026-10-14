/**
 * HUB by Raisen — Canales (/channels). Sin datos mock (N5).
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CATALOGO } from "./channels-ui/channels-data";
import { useCanales } from "./channels-ui/channels-fetchers";
import { ChannelCard } from "./channels-ui/channel-card";

export const ChannelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels",
  component: ChannelsPage,
});

function ChannelsPage() {
  const { language } = usePreferences();
  const [abierto, setAbierto] = useState<string | null>(null);
  const { data, isPending, err, refetch } = useCanales();

  if (isPending) {
    return (
      <div className="view">
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t(language, "channels.loading")}</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="view">
        <div className="flex flex-col items-center gap-3 rounded-2xl glass-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t(language, "channels.error")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>{t(language, "channels.retry")}</Button>
        </div>
      </div>
    );
  }

  const canales = data ?? [];
  const porKind = new Map(canales.map((c) => [c.kind, c]));

  return (
    <div className="view">
      <h2 className="mb-1 text-lg font-bold text-foreground">
        {t(language, "channels.connected")}
      </h2>

      {canales.length === 0 ? (
        <div className="mb-4 rounded-2xl glass-card p-4 text-sm text-muted-foreground">
          {t(language, "channels.empty")} {t(language, "channels.emptyBody")}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {CATALOGO.map((kind) => (
          <ChannelCard
            key={kind}
            language={language}
            kind={kind}
            canal={porKind.get(kind)}
            esAbierto={abierto === kind}
            onToggleExpand={() => setAbierto(abierto === kind ? null : kind)}
          />
        ))}
      </div>
    </div>
  );
}