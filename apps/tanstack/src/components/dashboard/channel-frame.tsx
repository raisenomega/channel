/**
 * HUB by Raisen — ChannelFrame (layout horizontal)
 *
 * Distribuye la vista de CUALQUIER canal en dos columnas:
 *   - Columna izquierda (.cf-left): el celular del canal (children).
 *   - Columna derecha (.cf-right): pestañas de negocio + contenido + composer.
 *
 * No renderiza título ni acciones antiguas: solo tabs + content + composer.
 */
import type { ReactNode } from "react";
import { t, type Idioma } from "@/lib/i18n";

/** Pestañas de negocio disponibles en la columna derecha. */
export type ChannelTab =
  | "agentes"
  | "contactos"
  | "plantillas"
  | "cotizacion"
  | "factura"
  | "pagos"
  | "documentos";

const TABS: readonly ChannelTab[] = [
  "agentes",
  "contactos",
  "plantillas",
  "cotizacion",
  "factura",
  "pagos",
  "documentos",
];

export interface ChannelFrameProps {
  lang: Idioma;
  /** Triplete HSL (sin `hsl()`) para colorear la pestaña activa. */
  accent?: string;
  /** Mantenido por compatibilidad; no se renderiza en este layout. */
  icon?: ReactNode;
  /** El celular del canal. */
  children: ReactNode;
  /** Contenido a mostrar en la columna derecha. Por defecto `ChatAmplified`. */
  composerContent?: ReactNode;
  composerValue?: string;
  onComposerChange?: (value: string) => void;
  onSend?: () => void;
  /** Pestaña activa. */
  active?: ChannelTab;
  onTabChange?: (tab: ChannelTab) => void;
}

/**
 * Placeholder para la "conversación ampliada" cuando no se inyecta contenido
 * propio en la columna derecha (.cf-content).
 */
export function ChatAmplified({ lang }: { lang: Idioma }) {
  return (
    <div className="cf-conv-placeholder">
      <span className="cf-conv-title">{t(lang, "cf.convTitle")}</span>
      <span className="cf-conv-sub">{t(lang, "cf.convSub")}</span>
    </div>
  );
}

/* ────────────────────────────────────────────
   ChannelFrame
   ──────────────────────────────────────────── */
export function ChannelFrame({
  lang,
  accent,
  children,
  composerContent,
  composerValue,
  onComposerChange,
  onSend,
  active,
  onTabChange,
}: ChannelFrameProps) {
  const accentColor = accent ?? "var(--primary)";

  return (
    <div className="cf-root">
      {/* Columna 1: celular */}
      <div className="cf-left">{children}</div>

      {/* Columna 2 (derecha): pestañas de negocio + content + composer */}
      <div className="cf-right">
        <nav className="cf-tabs" aria-label={t(lang, "cf.tabsLabel")}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={"chip" + (active === tab ? " active" : "")}
              onClick={() => onTabChange?.(tab)}
              style={
                active === tab ? { color: `hsl(${accentColor})`, borderColor: `hsl(${accentColor})` } : undefined
              }
            >
              <span className="chip-name">{t(lang, "cf." + tab)}</span>
            </button>
          ))}
        </nav>

        <div className="cf-content">
          {composerContent ?? <ChatAmplified lang={lang} />}
        </div>

        <div className="cf-composer">
          <input
            className="cf-input"
            value={composerValue ?? ""}
            onChange={(e) => onComposerChange?.(e.currentTarget.value)}
            placeholder={t(lang, "chat.placeholder")}
          />
          <button
            className="cf-send"
            type="button"
            onClick={() => onSend?.()}
            disabled={!composerValue?.trim()}
          >
            {t(lang, "chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}