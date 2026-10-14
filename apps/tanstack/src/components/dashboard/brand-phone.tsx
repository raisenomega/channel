/**
 * HUB by Raisen — Celular Samsung S25 con la app de cada red social
 * y su identidad visual REAL.
 *
 * Reutiliza la carcasa .wa-phone/.wa-screen del CSS aislado
 * (whatsapp-dev.css) y solo teñye la pantalla con el color de marca.
 * Estilos 100% aislados con prefijos "bp-"/"bg-".
 */
import type { ReactNode } from "react";

export type BrandKind =
  | "whatsapp"
  | "instagram"
  | "gmail"
  | "facebook"
  | "telegram"
  | "sms"
  | "x"
  | "linkedin"
  | "webchat";

interface BrandSpec {
  id: BrandKind;
  name: string;
  /** Color de fondo base de la pantalla / app. */
  bg: string;
  /** Color oscuro para la cabecera con texto blanco (si aplica). */
  headerBg: string;
  /** Color principal de acentos / botones. */
  accent: string;
  barBg: string;
  barColor: string;
}

const BRANDS: Record<BrandKind, BrandSpec> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    bg: "#e5ddd5",
    headerBg: "#075e54",
    accent: "#25D366",
    barBg: "#f7f8fa",
    barColor: "#111",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    bg: "#ffffff",
    headerBg: "#ffffff",
    accent: "#E4405F",
    barBg: "#ffffff",
    barColor: "#262626",
  },
  gmail: {
    id: "gmail",
    name: "Gmail",
    bg: "#ffffff",
    headerBg: "#ffffff",
    accent: "#EA4335",
    barBg: "#ffffff",
    barColor: "#202124",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    bg: "#ffffff",
    headerBg: "#ffffff",
    accent: "#1877F2",
    barBg: "#ffffff",
    barColor: "#1c1e21",
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    bg: "#e2eff6",
    headerBg: "#ffffff",
    accent: "#26A5E4",
    barBg: "#ffffff",
    barColor: "#0f0f0f",
  },
  sms: {
    id: "sms",
    name: "Mensajes",
    bg: "#ffffff",
    headerBg: "#ffffff",
    accent: "#4CAF50",
    barBg: "#ffffff",
    barColor: "#111",
  },
  x: {
    id: "x",
    name: "X",
    bg: "#000000",
    headerBg: "#000000",
    accent: "#1d9bf0",
    barBg: "#000000",
    barColor: "#ffffff",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    bg: "#ffffff",
    headerBg: "#ffffff",
    accent: "#0A66C2",
    barBg: "#ffffff",
    barColor: "#111",
  },
  webchat: {
    id: "webchat",
    name: "Web Chat",
    bg: "#f4f5fb",
    headerBg: "#6C63FF",
    accent: "#6C63FF",
    barBg: "#6C63FF",
    barColor: "#ffffff",
  },
};

/* ---------- Iconos SVG aislados ---------- */
const IC = {
  igCamera:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  igDm:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4z"/><path d="M7 10h10M7 14h6"/></svg>',
  gmailCompose:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"/></svg>',
  gmailSearch:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  fbLogo:
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="#1877F2"><path d="M24 12.07C24 5.4 18.63.07 12 .07S0 5.4 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08v-3.47h3.05V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95H15.8c-1.49 0-1.95.93-1.95 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07z"/></svg>',
  tgPlane:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="#fff"><path d="M21.9 3.1a1.1 1.1 0 0 0-1.1-.1L2.4 9.5c-.8.3-.8 1.4 0 1.7l4.6 1.6 1.8 5.3c.2.7 1.1.9 1.6.4l2.5-2.4 4.8 3.6c.6.4 1.4.1 1.6-.6L22 4.5a1.1 1.1 0 0 0-.1-1.4zM9.4 13l8.4-5.4-6.4 6.8c-.1.1-.2.3-.2.4l-.3 2.7-1.5-4.5z"/></svg>',
  xLogo:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/></svg>',
  send:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
  plus:
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>',
  pen:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"/></svg>',
  smsPlus:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2 2h20v16H6l-4 4z" opacity="0"/><path d="M12 3a9 9 0 0 1 9 9c0 2.5-1 4.8-2.7 6.5l.8 3.5-3.6-1.7A8.9 8.9 0 0 1 12 21a9 9 0 1 1 0-18zm-1 4v4H7v2h4v4h2v-4h4v-2h-4V7z"/></svg>',
};

/* Gradiente oficial de Instagram (rosa -> morado -> azul). */
const IG_GRADIENT =
  "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)";

/**
 * Carcasa Samsung S25 con la pantalla teñida del color de la marca.
 * children es el contenido de la app dentro del teléfono.
 */
export function BrandPhone({
  kind,
  children,
  header,
}: { kind: BrandKind; children?: ReactNode; header?: ReactNode }) {
  const { bg, barColor } = BRANDS[kind];

  return (
    <div className="wa-phone">
      <div className="wa-screen" style={{ background: bg }}>
        <span className="wa-punch" />
        {header ?? <BrandHeader kind={kind} />}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            background: bg,
            color: barColor,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Cabecera de la marca, realista, según el canal. Al menos Instagram y
 * Gmail se ven distintamente reales.
 */
export function BrandHeader({ kind }: { kind: BrandKind }) {
  switch (kind) {
    case "instagram":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            background: "#ffffff",
            color: "#262626",
            borderBottom: "1px solid #dbdbdb",
            zIndex: 5,
          }}
        >
          <span className="bg-logo" dangerouslySetInnerHTML={{ __html: IC.igCamera }} />
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: 0.5,
            }}
          >
            Instagram
          </span>
          <span className="bg-logo" dangerouslySetInnerHTML={{ __html: IC.igDm }} />
        </div>
      );

    case "gmail":
      return (
        <div
          className="bg-head"
          style={{
            background: "#ffffff",
            color: "#202124",
            zIndex: 5,
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px" }}>
            <span className="bg-row">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22 12l-1.9-1.6L22 8.9V5H2v14h20v-7z" opacity="0" />
                <path fill="#4285F4" d="M23 6.7c0-.6-.4-1-1-1H2c-.6 0-1 .4-1 1v4l11 6.5L23 10.7z" />
                <path fill="#EA4335" d="M1 14v3.3c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V14l-10.6-3.3z" opacity="0" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#5f6368" }}>Gmail</span>
            </span>
            <span className="bg-row" style={{ marginLeft: "auto", color: "#5f6368" }} dangerouslySetInnerHTML={{ __html: IC.gmailSearch }} />
          </div>
        </div>
      );

    case "facebook":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "#ffffff",
            color: "#1c1e21",
            borderBottom: "1px solid #e4e6eb",
            zIndex: 5,
          }}
        >
          <span className="bg-logo" dangerouslySetInnerHTML={{ __html: IC.fbLogo }} />
          <input
            readOnly
            placeholder="Buscar"
            style={{
              flex: 1,
              background: "#f0f2f5",
              border: "none",
              borderRadius: 20,
              padding: "7px 12px",
              fontSize: 13,
              outline: "none",
            }}
          />
          <span className="bg-logo"><svg viewBox="0 0 24 24" width="22" height="22" fill="#65676b"><path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm9 4h-1a8 8 0 0 0-1.5-2.7l.7-.7a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0l-.7.7A7.6 7.6 0 0 0 13 4.9V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v.9a7.6 7.6 0 0 0-3.7 2.3l-.7-.7a1 1 0 0 0-1.4 0L1.8 7.9a1 1 0 0 0 0 1.4l.7.7A8 8 0 0 0 1 12.9H1a1 1 0 0 0 1 1h.9A7.6 7.6 0 0 0 4 15.6l-.7.7a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l.7-.7a7.6 7.6 0 0 0 2.3 1.3v.9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.9a7.6 7.6 0 0 0 2.3-1.3l.7.7a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 0-1.4l-.7-.7a7.6 7.6 0 0 0 1.3-2.3h.9a1 1 0 0 0 1-1z" opacity="0"/><circle cx="12" cy="16" r="3" fill="#65676b"/><path d="M12 3l1.6 4H15v6h-2V8h-2v5H9V7h1.4z" fill="#65676b"/></svg></span>
        </div>
      );

    case "whatsapp":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 10px 8px",
            background: "#075e54",
            color: "#fff",
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#128c7e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            HB
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>WhatsApp</span>
          <span className="bg-logo" dangerouslySetInnerHTML={{ __html: IC.gmailSearch }} />
        </div>
      );

    case "telegram":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "#ffffff",
            color: "#0f0f0f",
            borderBottom: "1px solid #e6edf3",
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#26A5E4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{ __html: IC.tgPlane }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Telegram</span>
          <span className="bg-logo" style={{ color: "#26A5E4" }} dangerouslySetInnerHTML={{ __html: IC.pen }} />
        </div>
      );

    case "x":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            background: "#000000",
            color: "#ffffff",
            zIndex: 5,
          }}
        >
          <span className="bg-avatar" style={{ color: "#fff" }}>u</span>
          <span className="bg-logo" style={{ marginLeft: "auto" }} dangerouslySetInnerHTML={{ __html: IC.xLogo }} />
          <span className="bg-logo" style={{ color: "#71767b" }} dangerouslySetInnerHTML={{ __html: IC.smsPlus }} />
        </div>
      );

    case "linkedin":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "#ffffff",
            color: "#111",
            borderBottom: "1px solid #e0e0e0",
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: "#0A66C2",
            }}
          >
            in
          </span>
          <input
            readOnly
            placeholder="Buscar"
            style={{
              flex: 1,
              background: "#eef3f8",
              border: "none",
              borderRadius: 5,
              padding: "7px 12px",
              fontSize: 13,
              outline: "none",
            }}
          />
          <span className="bg-logo" style={{ color: "#0A66C2" }} dangerouslySetInnerHTML={{ __html: IC.gmailCompose }} />
        </div>
      );

    case "sms":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: "#ffffff",
            color: "#111",
            borderBottom: "1px solid #eee",
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Mensajes</span>
          <span className="bg-logo" style={{ color: "#4CAF50" }} dangerouslySetInnerHTML={{ __html: IC.smsPlus }} />
        </div>
      );

    case "webchat":
      return (
        <div
          className="bg-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            background: "#6C63FF",
            color: "#fff",
            zIndex: 5,
          }}
        >
          <span className="bg-avatar">WB</span>
          <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>Web Chat</span>
          <span className="bg-logo" dangerouslySetInnerHTML={{ __html: IC.gmailSearch }} />
        </div>
      );
  }
}

/** Fondo de botón "Redactar" de Gmail (rojo marca) — accesible para external callers. */
export const gmailComposeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#EA4335",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 25,
  padding: "8px 14px",
  margin: "10px 12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  cursor: "pointer",
};

/** Gradiente oficial de Instagram expuesto para uso externo. */
export const instagramGradient = IG_GRADIENT;