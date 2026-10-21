/**
 * HUB by Raisen — Barra superior de canales (chbar).
 * Vive en el hueco entre el header principal y la pagina flotante.
 * Permite cambiar de red sin salir; la X cierra y vuelve al inbox.
 */
import { useNavigate } from "@tanstack/react-router";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ChannelIcon, type ChannelKind } from "@/components/ui/channel-icon";
import { AlertBadge } from "@/components/ui/alert-badge";
import { ALL_CHANNELS, ALL_ACCENT } from "./channel-meta";

export function ChannelBar({ lang, kind, to }: {
  lang: Idioma;
  kind: ChannelKind;
  to: string;
}) {
  const navigate = useNavigate();
  const toPath = to as "/channels/$channelId";
  return (
    <div className="chbar">
      <div className="chbar-chiplist">
        {ALL_CHANNELS.map((c) => {
          const activeCanal = c === kind;
          return (
            <button
              key={c}
              type="button"
              className={"chbar-chip" + (activeCanal ? " on" : "")}
              style={activeCanal ? { color: `hsl(${ALL_ACCENT[c]})`, borderColor: `hsl(${ALL_ACCENT[c]})` } : undefined}
              onClick={() => { if (!activeCanal) void navigate({ to: toPath, params: { channelId: c } }); }}
            >
              <ChannelIcon kind={c} className="chbar-ico" />
              <span>{t(lang, "canal." + c)}</span>
              <AlertBadge keyName={"channel:" + c} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="chbar-x"
        aria-label={t(lang, "canal.cerrar")}
        title={t(lang, "canal.cerrar")}
        onClick={() => void navigate({ to: "/inbox" })}
      >
        ×
      </button>
    </div>
  );
}