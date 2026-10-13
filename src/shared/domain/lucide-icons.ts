/**
 * Lucide Icon Library — HUB by Raisen
 * Solo SVG. Cero emojis. Cero dependencias externas.
 * Todas las dimensiones: 24x24 viewBox.
 *
 * Uso: lucide("icon-name", { size: 20, color: "#0FB5A6" })
 */

export type LucideIcon = string; // raw SVG path

export interface LucideOptions {
  readonly size?: number;
  readonly color?: string;
  readonly stroke?: number;
}

export const lucide = (
  name: string,
  opts: LucideOptions = {},
): string => {
  const s = opts.size ?? 24;
  const c = opts.color ?? "currentColor";
  const p = SVG_PATHS[name as keyof typeof SVG_PATHS];
  if (!p) return "";
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${c}">${p}</svg>`;
};

const SVG_PATHS: Readonly<Record<string, string>> = Object.freeze({
  "message-square": "<rect x='3' y='3' rx='3' width='18' height='14'/><path d='M6 6l12 0v10h-12v-10z'/>",
  "inbox": "<path d='M3 9l8 4v6h-8v-6H3zM5 8l6 4v6h-6v-6H5zM7 11l10 2v6h-10v-6H7z'/>",
  "channels": "<circle cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='1.5'/><path d='M6 6l12 0v12h-12v-12z' fill='currentColor'/><circle cx='8' cy='10' r='2' fill='currentColor'/>",
  "agent": "<circle cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='1.5'/><path d='M10 6l4 4v6h-4v-4H10zM8 10l8 2v6h-8v-6H8z' fill='currentColor'/>",
  "sales": "<path d='M4 16l6-6v-2h6v8H4zM14 10l6 2v6h-6v-2H14z' fill='currentColor'/><path d='M6 10l12 2v4h-12v-4H6z' fill='none' stroke='currentColor' stroke-width='1.5'/>",
  "contacts": "<circle cx='12' cy='10' r='8' fill='none' stroke='currentColor' stroke-width='1.8'/><circle cx='9' cy='10' r='2.5' fill='currentColor'/><circle cx='15' cy='10' r='2.5' fill='currentColor'/><circle cx='12' cy='7' r='2' fill='currentColor'/>",
  "settings": "<circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='1.8'/><line x1='3' y1='3' x2='3' y2='21' stroke='currentColor' stroke-width='1.5'/><line x1='21' y1='3' x2='21' y2='21' stroke='currentColor' stroke-width='1.5'/>",
  "check": "<path d='M5 7l4 3v-3h-1v5H5zM14 7l3 3v-3h-1v5H14z' fill='none' stroke='currentColor' stroke-width='2.5'/>",
  "cross": "<line x1='5' y1='5' x2='19' y2='19' stroke='currentColor' stroke-width='2.5'/><line x1='5' y1='19' x2='19' y2='5' stroke='currentColor' stroke-width='2.5'/>",
  "arrow-right": "<path d='M3 12l8 0v-4h-8v4H3z'/>",
  "arrow-up": "<path d='M10 4l0-8h8v8H10z' fill='none' stroke='currentColor' stroke-width='2'/>",
  "arrow-down": "<path d='M10 4l0 8h8v-8H10z' fill='none' stroke='currentColor' stroke-width='2'/>",
  "chevron-right": "<path d='M6 3l6 9v-9h-6v9H6z' fill='none' stroke='currentColor' stroke-width='2'/>",
  "chevron-left": "<path d='M6 3l6-9v9h-6v-9H6z' fill='none' stroke='currentColor' stroke-width='2'/>",
  "phone": "<rect x='4' y='2' rx='5' width='16' height='20'/><path d='M6 12h12v-2h-12z'/>",
  "mail": "<rect x='2' y='2' rx='3' width='20' height='15'/><path d='M4 4h16v3h-16z'/><path d='M4 8h16v3h-16z'/>",
  "chat": "<rect x='2' y='2' rx='6' width='20' height='12'/><path d='M6 16l12 0v4h-12v-4z'/>",
  "bell": "<path d='M8 2l8 0v-2h-8v2H8zM12 6l4 6v-6h-4z' fill='none' stroke='currentColor' stroke-width='1.8'/><circle cx='12' cy='4' r='3'/>",
  "search": "<circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='1.5'/><path d='M6 6l4 4v-4h-2v4H6z' transform='rotate(-45,12,12)'/>",
  "star": "<path d='M12 2l4 8v-6h-8v6H12zM8 10l8 0v-4h-8v4H8z' fill='none' stroke='currentColor' stroke-width='1.5'/>",
  "trash": "<rect x='4' y='4' rx='3' width='16' height='14'/><line x1='6' y1='6' x2='6' y2='18' stroke='currentColor' stroke-width='2'/><line x1='18' y1='6' x2='18' y2='18' stroke='currentColor' stroke-width='2'/><path d='M4 2l16 0v-2h-16z'/>",
  "edit": "<rect x='4' y='4' rx='2' width='16' height='16'/><path d='M8 8l8 0v2h-8v-2H8zM8 12l8 0v2h-8v-2H8z'/>",
  "send": "<path d='M8 8l8 0v8h-8v-8H8zM12 6l0 12v-8h4v8H12z' fill='none' stroke='currentColor' stroke-width='1.8'/>",
  "attachment": "<path d='M6 14l12 0v-4h-12v4H6zM4 4l4 8v-4h-2v4H4z'/>",
  "info-circle": "<circle cx='12' cy='12' r='11' fill='none' stroke='currentColor' stroke-width='1.8'/>",
  "warning-triangle": "<path d='M2 20l10-8v-8h-10v8H2z' fill='none' stroke='currentColor' stroke-width='1.8'/><line x1='7' y1='6' x2='17' y2='6' stroke='currentColor' stroke-width='3'/>",
});