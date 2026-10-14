/**
 * HUB by Raisen — ChannelFrame (panel flotante glass)
 *
 * Envuelve la vista de CUALQUIER canal en un panel flotante con
 * estética glass (blur + glow). Incluye:
 *   - Header fijo compacto (icono + título + pills de acciones)
 *   - children (contenido del canal, ej. celular simulado)
 *   - Barra de input en el panel (fuera del contenido del canal)
 */
import { t, type Idioma } from "@/lib/i18n";

/* ────────────────────────────────────────────
   Interface: ChannelFrameActions
   ──────────────────────────────────────────── */
export interface ChannelFrameActions {
  templates: boolean;
  cotizacion: boolean;
  pagos: boolean;
  ordenes: boolean;
}

/* ────────────────────────────────────────────
   SVG inline helpers (sin emojis)
   ──────────────────────────────────────────── */
const Svg = {
  /* Icono genérico para el canal (replace / placeholder) */
  channel:
    /*<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">*/
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.5 1.2 4.7 3.1 6.2L4 21l3.4-1.5c1.4.5 3 .8 4.6.8 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/>'
    + "</svg>",

  /* Templates */
  templates:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M5 5l14 2 2 14M19 19H14V14z"/>'
    + "</svg>",

  /* Cotización (clipboard / documento) */
  cotizacion:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M6 4h12l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 3v5h5z"/>'
    + "</svg>",

  /* Pagos (tarjeta / moneda) */
  pagos:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M3 7h18v2a6 6 0 0 0 1.5 1.5l-11-7V2h-2V7a8 8 0 0 0-3.54.5L8 16z"/>'
    + "</svg>",

  /* Órdenes (box / paquete) */
  ordenes:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M4 4h16v16h-16V-16zM22 6h-7v9H7z"/>'
    + "</svg>",

  /* Send (paper plane / flecha) */
  send:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M2 21l21-9L2 3v7l15 2-15 2z"/>'
    + "</svg>",
};

/* ────────────────────────────────────────────
   ChannelFrame
   ──────────────────────────────────────────── */
export function ChannelFrame({
  title,
  icon,
  children,
  composer,
  onSend,
  composerValue,
  onComposerChange,
  actions,
  accent,
  lang,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  composer?: boolean;
  onSend?: () => void;
  composerValue?: string;
  onComposerChange?: (value: string) => void;
  actions?: Partial<ChannelFrameActions>;
  accent?: string;
  lang: Idioma;
}) {
  const a = actions ?? {};
  const accentColor = accent ?? "var(--primary)";

  /* ---------- pills de acciones ---------- */
  const pills: Array<{ key: string; show: boolean; labelKey: string; svg: string }> = [
    { key: "templates", show: !!a.templates, labelKey: "channelFrame.templates", svg: Svg.templates },
    { key: "cotizacion", show: !!a.cotizacion, labelKey: "channelFrame.cotizacion", svg: Svg.cotizacion },
    { key: "pagos", show: !!a.pagos, labelKey: "channelFrame.pagos", svg: Svg.pagos },
    { key: "ordenes", show: !!a.ordenes, labelKey: "channelFrame.ordenes", svg: Svg.ordenes },
  ];

  return (
    <div
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        /* accent border override */
        borderColor: `hsl(${accentColor} / 0.45)`,
      }}
    >
      {/* (1) Header fijo compacto */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: `1px solid hsl(${accentColor} / 0.25)`,
          background: "transparent",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Icono + título */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: `hsl(${accentColor})` }}>
          {icon ?? (
            <span
              dangerouslySetInnerHTML={{ __html: Svg.channel }}
              style={{ width: 20, height: 20, color: `hsl(${accentColor})` }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: "hsl(var(--foreground))",
            }}
          >
            {title}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Pills de acciones */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {pills
            .filter((p) => p.show)
            .map((p) => (
              <button
                key={p.key}
                type="button"
                aria-label={t(lang, p.labelKey)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid hsl(${accentColor} / 0.35)`,
                  background: `hsl(${accentColor} / 0.1)`,
                  color: `hsl(${accentColor})`,
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  lineHeight: 1.3,
                }}
                dangerouslySetInnerHTML={{
                  __html: `${p.svg}<span style="margin-left:2px">${t(lang, p.labelKey)}</span>`,
                }}
              />
            ))}
        </div>
      </div>

      {/* (2) children — contenido del canal */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          padding: "0 4px",
        }}
      >
        {children}
      </div>

      {/* (3) Barra de input en el panel (fuera del contenido) */}
      {composer !== false ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderTop: `1px solid hsl(${accentColor} / 0.2)`,
            background: "transparent",
            backdropFilter: "blur(4px)",
          }}
        >
          <textarea
            rows={1}
            value={composerValue ?? ""}
            onChange={(e) => {
              onComposerChange?.(e.currentTarget.value);
            }}
            placeholder={t(lang, "chat.placeholder")}
            style={{
              flex: 1,
              minWidth: 0,
              resize: "none",
              padding: "8px 12px",
              borderRadius: 12,
              border: `1px solid hsl(var(--border) / 0.35)`,
              background: "transparent",
              color: "hsl(var(--foreground))",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1.4,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => onSend?.()}
            aria-label={t(lang, "chat.send")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: `hsl(${accentColor})`,
              color: "hsl(var(--background))",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: `0 0 14px -2px hsl(${accentColor} / 0.4)`,
              lineHeight: 1,
            }}
            dangerouslySetInnerHTML={{ __html: Svg.send }}
          />
        </div>
      ) : null}
    </div>
  );
}