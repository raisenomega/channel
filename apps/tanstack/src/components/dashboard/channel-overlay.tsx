/**
 * HUB by Raisen — ChannelOverlay
 *
 * Overlay de la página flotante de canal (ChannelFrame + BrandPhone +
 * WaContactBar). Cuando el usuario abre un canal desde el inbox:
 *   - Se superpone (.cao-body) al contenido del inbox, que queda detrás.
 *   - La BARRA DE CANALES (.cao-bar) se ubica en la franja ENTRE el header
 *     principal del shell (.nav ~56px) y el header de la página flotante.
 *
 * NO altera los tamaños de la página flotante (.cf-* / .wa-*).
 */
import type { ReactNode } from "react";
import type { ChannelKind } from "@/components/ui/channel-icon";

/** Catálogo completo de canales disponibles (mismo orden que la app). */
const CANALES: readonly ChannelKind[] = [
  "whatsapp",
  "email",
  "instagram",
  "facebook",
  "telegram",
  "sms",
  "x",
  "linkedin",
  "webchat",
];

/** Etiqueta legible por canal (minúscula, de uso cosmético en la franja). */
const ETIQUETA: Record<ChannelKind, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram",
  sms: "SMS",
  x: "X",
  linkedin: "LinkedIn",
  webchat: "Web Chat",
};

export interface ChannelOverlayProps {
  /** Si el overlay está abierto (renderiza franja + página flotante). */
  open: boolean;
  /** Canal activo (ChannelKind). */
  selected: string;
  /** Cambiar de red SIN salir del overlay. */
  onSelect: (kind: string) => void;
  /** Cerrar todo y volver al inbox. */
  onClose: () => void;
  /** La página flotante (ChannelFrame + BrandPhone + WaContactBar). */
  children: ReactNode;
}

/**
 * Overlay de la página flotante de canal: reposiciona la barra de canales en
 * la franja entre el header del shell y el header del panel flotante.
 */
export function ChannelOverlay({
  open,
  selected,
  onSelect,
  onClose,
  children,
}: ChannelOverlayProps) {
  return (
    <div className="cao">
      {/* FRANJA de canales: se ubica en el espacio ENTRE el header principal
          del shell (~56px) y el header del panel flotante. No se pone encima
          de ninguno de los dos headers. */}
      {open && (
        <div className="cao-bar" role="tablist" aria-label="Canales">
          {CANALES.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === selected}
              className={"cao-chip" + (k === selected ? " on" : "")}
              onClick={() => onSelect(k)}
            >
              {ETIQUETA[k]}
            </button>
          ))}
          {/* X al final completo lado derecho: cierra barra + overlay */}
          <button
            type="button"
            className="cao-x"
            aria-label="cerrar"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
      )}

      {/* Overlay de la página flotante: se superpone sobre el inbox, debajo
          de la franja. */}
      {open && <div className="cao-body">{children}</div>}
    </div>
  );
}