/**
 * HUB by Raisen — Metadatos de marca por canal (ChannelMeta).
 * Define el acento hsl, hex, colores de pantalla y burbujas de cada canal,
 * más la paleta de canales de la barra superior y utilidades de avatar.
 */
import type { ChannelKind } from "@/components/ui/channel-icon";
import type { BrandKind } from "@/components/dashboard/brand/brand-specs";

/** Acento único (triplete HSL sin hsl()) para el panel ChannelFrame. */
export interface ChannelMeta {
  brand: BrandKind;
  /** Acento único (triplete HSL sin hsl()) para el panel ChannelFrame. */
  hsl: string;
  /** Acento hex usado en la cabecera del chat interno del celular. */
  hex: string;
  /** Color de fondo de pantalla del celular. */
  bg: string;
  /** Color de texto primario dentro de la pantalla del celular. */
  fg: string;
  /** Color de texto secundario/muted dentro del celular. */
  muted: string;
  /** Fondo de una burbuja entrante. */
  bubbleIn: string;
  /** Fondo de una burbuja saliente. */
  bubbleOut: string;
}

export const CHANNEL_META: Record<ChannelKind, ChannelMeta> = {
  whatsapp: { brand: "whatsapp", hsl: "142 70% 28%", hex: "#075e54", bg: "#e5ddd5", fg: "#1f2926", muted: "#667781", bubbleIn: "#ffffff", bubbleOut: "#d9fdd3" },
  email:    { brand: "gmail",    hsl: "4 82% 56%",   hex: "#EA4335", bg: "#ffffff", fg: "#202124", muted: "#5f6368", bubbleIn: "#f1f3f4", bubbleOut: "#fce8e6" },
  instagram:{ brand: "instagram",hsl: "332 72% 50%", hex: "#d62976", bg: "#ffffff", fg: "#262626", muted: "#8e8e8e", bubbleIn: "#efefef", bubbleOut: "#ffd6e6" },
  facebook: { brand: "facebook", hsl: "221 88% 53%", hex: "#1877F2", bg: "#ffffff", fg: "#1c1e21", muted: "#65676b", bubbleIn: "#e4e6eb", bubbleOut: "#dcebff" },
  telegram: { brand: "telegram", hsl: "201 78% 52%", hex: "#26A5E4", bg: "#ffffff", fg: "#0f1419", muted: "#5b7083", bubbleIn: "#e8eef3", bubbleOut: "#d2ecfb" },
  sms:      { brand: "sms",      hsl: "122 39% 49%", hex: "#4CAF50", bg: "#ffffff", fg: "#111111", muted: "#5f6368", bubbleIn: "#eef1ee", bubbleOut: "#dcf5dd" },
  x:        { brand: "x",        hsl: "210 60% 55%", hex: "#1d9bf0", bg: "#000000", fg: "#e7e9ea", muted: "#71767b", bubbleIn: "#2f3336", bubbleOut: "#1d9bf0" },
  linkedin: { brand: "linkedin", hsl: "203 89% 40%", hex: "#0A66C2", bg: "#ffffff", fg: "#111111", muted: "#666666", bubbleIn: "#eef3f8", bubbleOut: "#e2edf9" },
  webchat:  { brand: "webchat",  hsl: "240 100% 69%",hex: "#6C63FF", bg: "#f4f5fb", fg: "#1b1b2f", muted: "#6a6a7d", bubbleIn: "#ffffff", bubbleOut: "#ddd9ff" },
};

/** Todos los canales disponibles para la barra superior de cambio de red. */
export const ALL_CHANNELS: readonly ChannelKind[] = [
  "whatsapp", "email", "instagram", "facebook", "telegram",
  "sms", "x", "linkedin", "webchat",
];

/** Accent (hsl) de cada canal para el borde de la pagina flotante. */
export const ALL_ACCENT: Record<string, string> = {
  whatsapp: "142 70% 28%", email: "4 82% 56%", instagram: "332 72% 50%",
  facebook: "221 88% 53%", telegram: "201 78% 52%", sms: "122 39% 49%",
  x: "210 60% 55%", linkedin: "203 89% 40%", webchat: "240 100% 69%",
};

/** Colores de avatar deterministas por nombre. */
const AVATAR_COLORS = ["#075e54", "#128c7e", "#1f8a52", "#0a7ea4", "#7c3aed", "#c92a2a", "#0b7285", "#7048e8"];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? "#075e54";
}

export function initials(name: string): string {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}