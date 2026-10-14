/**
 * HUB by Raisen — Utilidades de preferencias de interfaz.
 */
export const KEY_TEMA = "hub.tema";
export const KEY_IDIOMA = "hub.idioma";
export const KEY_WHITE_LABEL = "hub.whiteLabel";
export const EVENTO_UI = "hub:ui-changed";

export function leer(key: string, def: string): string {
  try {
    return localStorage.getItem(key) || def;
  } catch {
    return def;
  }
}

export function guardar(key: string, valor: string): void {
  try {
    localStorage.setItem(key, valor);
  } catch {
    // ignora
  }
}

export function notificar(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_UI));
}