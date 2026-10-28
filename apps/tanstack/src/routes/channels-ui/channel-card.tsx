import { t } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TONE } from "./channels-data";
import { onToggleCanal } from "./channels-fetchers";
import { ConfigRows } from "./config-rows";
import { ConnectCta } from "./connect-cta";
import type { Channel } from "@/lib/channels-client";
import type { ChannelKind } from "@/components/ui/channel-icon";
import type { Idioma } from "@/lib/i18n";

/** O-8-bis: engrane compacto (Lucide settings-2) — reemplaza el boton ancho "Configuracion". */
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="M20 7h-9M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />
    </svg>
  );
}

function navigateCard(e: React.KeyboardEvent, navigate: ReturnType<typeof useNavigate>, kind: string) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    void navigate({ to: "/channels/$channelId", params: { channelId: kind } });
  }
}

export function ChannelCard({
  language, kind, canal, connectedLive, esAbierto, onToggleExpand, disabled = false, onToggled,
}: {
  language: Idioma;
  kind: ChannelKind;
  canal: Channel | undefined;
  connectedLive: boolean; // VERDAD VIVA (Zernio), no el flag guardado: el chip ya no miente
  esAbierto: boolean;
  onToggleExpand: () => void;
  disabled?: boolean;
  onToggled?: () => void;
}) {
  const navigate = useNavigate();
  const state: Channel["state"] = connectedLive ? "conectado" : "desconectado"; // chip = verdad viva, no el flag

  // O-8-bis: layout compacto (match /reportes). Header icono+nombre+engrane; chip+switch inline.
  return (
    <Card data-testid="channel-card" aria-disabled={disabled} padded={false}
      className={`p-3.5 ${disabled ? "cursor-not-allowed opacity-70" : canal ? "cursor-pointer" : "cursor-pointer opacity-80"}`}
      role="button" tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) void navigate({ to: "/channels/$channelId", params: { channelId: kind } }); }}
      onKeyDown={(e) => { if (!disabled) navigateCard(e, navigate, kind); }}
    >
      <div className="flex items-center gap-2">
        <span className="text-primary"><ChannelIcon kind={kind} className="size-5" /></span>
        <span className="flex-1 truncate font-display text-sm font-bold text-foreground">{t(language, "canal." + kind)}</span>
        <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
          disabled={disabled} aria-label={t(language, "channels.config")} title={t(language, "channels.config")}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} onKeyDown={(e) => e.stopPropagation()}>
          <GearIcon />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge tone={TONE[state]} dot>{t(language, "channels.state." + state)}</Badge>
        <span aria-label={t(language, "channels.active")} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Switch checked={connectedLive} disabled={!canal} onChange={(v) => { void onToggleCanal(canal, v).then(() => onToggled?.()); }} />
        </span>
      </div>
      {!disabled ? (
        <div className="mt-2"><ConnectCta language={language} kind={kind} conectado={connectedLive} /></div>
      ) : null}
      {esAbierto ? <CardBody className="mt-2 border-t border-border/40 pt-2"><ConfigRows language={language} canal={canal} kind={kind} /></CardBody> : null}
    </Card>
  );
}
