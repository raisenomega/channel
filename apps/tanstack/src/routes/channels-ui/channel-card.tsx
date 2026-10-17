import { t } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TONE } from "./channels-data";
import { onToggleCanal } from "./channels-fetchers";
import { ConfigRows } from "./config-rows";
import type { Channel } from "@/lib/channels-client";
import type { ChannelKind } from "@/components/ui/channel-icon";
import type { Idioma } from "@/lib/i18n";

function navigateCard(e: React.KeyboardEvent, navigate: ReturnType<typeof useNavigate>, kind: string) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    void navigate({ to: "/channels/$channelId", params: { channelId: kind } });
  }
}

export function ChannelCard({
  language, kind, canal, esAbierto, onToggleExpand, disabled = false,
}: {
  language: Idioma;
  kind: ChannelKind;
  canal: Channel | undefined;
  esAbierto: boolean;
  onToggleExpand: () => void;
  /** L-2: sin tenant la card se ve pero no navega al detalle (nada que configurar aun). */
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const state = canal?.state ?? "desconectado";

  return (
    <Card data-testid="channel-card" aria-disabled={disabled}
      className={disabled ? "cursor-not-allowed opacity-70" : canal ? "cursor-pointer" : "cursor-pointer opacity-80"}
      role="button" tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) void navigate({ to: "/channels/$channelId", params: { channelId: kind } }); }}
      onKeyDown={(e) => { if (!disabled) navigateCard(e, navigate, kind); }}
    >
      <div className="flex items-center gap-3">
        <span className="text-primary"><ChannelIcon kind={kind} className="size-6" /></span>
        <div className="flex-1"><CardTitle className="text-sm">{t(language, "canal." + kind)}</CardTitle></div>
        <Badge tone={TONE[state]} dot>{t(language, "channels.state." + state)}</Badge>
      </div>
      <CardHeader className="mb-2 mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t(language, "channels.active")}</span>
        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch checked={canal?.active ?? false} disabled={!canal} onChange={(v) => onToggleCanal(canal, v)} />
        </span>
      </CardHeader>
      <Button variant="ghost" size="sm" className="w-full" disabled={disabled}
        onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
        {t(language, "channels.config")}
      </Button>
      {esAbierto ? <CardBody className="mt-2 border-t border-border/40 pt-3"><ConfigRows language={language} canal={canal} kind={kind} /></CardBody> : null}
    </Card>
  );
}