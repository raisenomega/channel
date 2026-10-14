/**
 * HUB by Raisen — Iconos SVG aislados para las marcas del celular.
 * Incluye el gradiente oficial de Instagram.
 */

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

/** Gradiente oficial de Instagram (rosa -> morado -> azul). */
const IG_GRADIENT =
  "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)";

/** Gradiente oficial de Instagram expuesto para uso externo. */
export const instagramGradient = IG_GRADIENT;

export function brandIcon(name: keyof typeof IC): string {
  return IC[name];
}