/**
 * HUB by Raisen — Canales (/channels).
 * Catálogo de canales disponibles con su estado real desde `inboxes`.
 * Cada tarjeta expande configuración (API key, proveedor, autonomía).
 * Sin datos mock: si no hay canales en la base, se muestra vacío honesto (N5).
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarCanales, toggleCanal, setAutonomia, type Channel } from "@/lib/channels-client";
import type { ChannelKind } from "@/components/ui/channel-icon";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const ChannelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels",
  component: ChannelsPage,
});

const CATALOGO: readonly ChannelKind[] = [
  "whatsapp", "email", "instagram", "facebook", "telegram",
  "sms", "x", "linkedin", "webchat",
];

const TONE: Readonly<Record<Channel["state"], "success" | "warn" | "process">> = {
  conectado: "success",
  desconectado: "warn",
  autonomo: "process",
};

function ChannelsPage() {
  const { language } = usePreferences();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const { data, isPending, refetch } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const r = await listarCanales();
      if (!r.ok) {
        setErr(true);
        return [];
      }
      setErr(false);
      return r.value;
    },
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <div className="view">
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "channels.loading")}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="view">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/45 bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t(language, "channels.error")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t(language, "channels.retry")}
          </Button>
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
        <div className="mb-4 rounded-2xl border border-border/45 bg-card p-4 text-sm text-muted-foreground">
          {t(language, "channels.empty")} {t(language, "channels.emptyBody")}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {CATALOGO.map((kind) => {
          const canal = porKind.get(kind);
          const state = canal?.state ?? "desconectado";
          const esAbierto = abierto === kind;
          return (
            <Card key={kind} className={canal ? "" : "opacity-80"}>
              <div className="flex items-center gap-3">
                <span className="text-primary">
                  <ChannelIcon kind={kind} className="size-6" />
                </span>
                <div className="flex-1">
                  <CardTitle className="text-sm">{t(language, "canal." + kind)}</CardTitle>
                </div>
                <Badge tone={TONE[state]} dot>
                  {t(language, "channels.state." + state)}
                </Badge>
              </div>

              <CardHeader className="mb-2 mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t(language, "channels.active")}
                </span>
                <Switch
                  checked={canal?.active ?? false}
                  disabled={!canal}
                  onChange={(v) => onToggle(canal, v)}
                />
              </CardHeader>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setAbierto(esAbierto ? null : kind)}
              >
                {t(language, "channels.config")}
              </Button>

              {esAbierto ? (
                <CardBody className="mt-2 border-t border-border/40 pt-3">
                  <ConfigRows language={language} canal={canal} kind={kind} />
                </CardBody>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ConfigRows({
  language, canal, kind,
}: {
  language: Parameters<typeof t>[0];
  canal: Channel | undefined;
  kind: ChannelKind;
}) {
  const [autonomia, setAutonomiaLocal] = useState(canal?.autonomous ?? false);
  const cambiaAut = (v: boolean) => {
    setAutonomiaLocal(v);
    if (canal) void setAutonomia(canal.id, v);
  };
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(language, "channels.apiKey")}</span>
        <span className="font-mono text-foreground">
          {canal?.apiKey ? "******" : t(language, "channels.providerNone")}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(language, "channels.provider")}</span>
        <span className="text-foreground">
          {canal?.provider ?? t(language, "channels.providerNone")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t(language, "channels.autonomia")}</span>
        <Switch checked={autonomia} disabled={!canal} onChange={cambiaAut} />
      </div>
      {!canal ? (
        <p className="text-xs text-muted-foreground">
          {t(language, "channels.emptyBody")} ({t(language, "canal." + kind)})
        </p>
      ) : null}
    </>
  );
}

function onToggle(canal: Channel | undefined, v: boolean) {
  if (!canal) return;
  void toggleCanal(canal.id, v);
}