/**
 * HUB by Raisen — Especificaciones de marca para el celular Samsung S25.
 * Define BrandKind, BrandSpec y la paleta real de cada red social.
 */

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

export interface BrandSpec {
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

export const BRANDS: Record<BrandKind, BrandSpec> = {
  whatsapp: { id: "whatsapp", name: "WhatsApp", bg: "#e5ddd5", headerBg: "#075e54", accent: "#25D366", barBg: "#f7f8fa", barColor: "#111" },
  instagram: { id: "instagram", name: "Instagram", bg: "#ffffff", headerBg: "#ffffff", accent: "#E4405F", barBg: "#ffffff", barColor: "#262626" },
  gmail: { id: "gmail", name: "Gmail", bg: "#ffffff", headerBg: "#ffffff", accent: "#EA4335", barBg: "#ffffff", barColor: "#202124" },
  facebook: { id: "facebook", name: "Facebook", bg: "#ffffff", headerBg: "#ffffff", accent: "#1877F2", barBg: "#ffffff", barColor: "#1c1e21" },
  telegram: { id: "telegram", name: "Telegram", bg: "#e2eff6", headerBg: "#ffffff", accent: "#26A5E4", barBg: "#ffffff", barColor: "#0f0f0f" },
  sms: { id: "sms", name: "Mensajes", bg: "#ffffff", headerBg: "#ffffff", accent: "#4CAF50", barBg: "#ffffff", barColor: "#111" },
  x: { id: "x", name: "X", bg: "#000000", headerBg: "#000000", accent: "#1d9bf0", barBg: "#000000", barColor: "#ffffff" },
  linkedin: { id: "linkedin", name: "LinkedIn", bg: "#ffffff", headerBg: "#ffffff", accent: "#0A66C2", barBg: "#ffffff", barColor: "#111" },
  webchat: { id: "webchat", name: "Web Chat", bg: "#f4f5fb", headerBg: "#6C63FF", accent: "#6C63FF", barBg: "#6C63FF", barColor: "#ffffff" },
};

/** Fondo de botón "Redactar" de Gmail (rojo marca) — accesible para external callers. */
export const gmailComposeStyle = {
  display: "inline-flex" as const,
  alignItems: "center" as const,
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