/**
 * HUB by Raisen — Preferencias de interfaz (tema, idioma + white-label).
 * El acceso a la preferencia se lee del DOM (data-theme) y de localStorage,
 * coherente con el script inline de index.html que delega los clicks.
 * Emite el CustomEvent "hub:ui-changed" para que la app re-renderice.
 */
import type { Idioma } from "./i18n.ts";

export type Tema = "dark" | "light";

const KEY_TEMA = "hub.tema";
const KEY_IDIOMA = "hub.idioma";
const KEY_WHITE_LABEL = "hub.whiteLabel";
export const EVENTO_UI = "hub:ui-changed";

function leer(key: string, def: string): string {
  try {
    return localStorage.getItem(key) || def;
  } catch {
    return def;
  }
}

export function getTema(): Tema {
  if (typeof document !== "undefined") {
    const t = document.documentElement.getAttribute("data-theme");
    return t === "light" ? "light" : "dark";
  }
  return (leer(KEY_TEMA, "dark") as Tema);
}

export function getIdioma(): Idioma {
  return leer(KEY_IDIOMA, "es") as Idioma;
}

function notificar(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_UI));
}

export function setTema(tema: Tema): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", tema);
  }
  try {
    localStorage.setItem(KEY_TEMA, tema);
  } catch {
    // ignora
  }
  notificar();
}

export function toggleTema(): Tema {
  const nuevo = getTema() === "dark" ? "light" : "dark";
  setTema(nuevo);
  return nuevo;
}

export function toggleIdioma(): Idioma {
  const nuevo = getIdioma() === "es" ? "en" : "es";
  try {
    localStorage.setItem(KEY_IDIOMA, nuevo);
  } catch {
    // ignora
  }
  notificar();
  return nuevo;
}

export function suscribirAlCambio(handler: () => void): () => void {
  window.addEventListener(EVENTO_UI, handler);
  return () => window.removeEventListener(EVENTO_UI, handler);
}

export function getWhiteLabel(): boolean {
  return leer(KEY_WHITE_LABEL, "false") === "true";
}

export function setWhiteLabel(activo: boolean): void {
  try {
    localStorage.setItem(KEY_WHITE_LABEL, activo ? "true" : "false");
  } catch {
    // ignora
  }
  if (typeof document !== "undefined") {
    const doc = document.documentElement;
    if (activo) {
      doc.setAttribute("data-white-label", "");
    } else {
      doc.removeAttribute("data-white-label");
    }
  }
  notificar();
}

export function toggleWhiteLabel(): boolean {
  const nuevo = !getWhiteLabel();
  setWhiteLabel(nuevo);
  return nuevo;
}

/** Aplica el tema guardado y sincroniza el label de idioma. */
export function iniciarControlesShell(): void {
  const langLabel = document.querySelector<HTMLElement>("[data-lang-label]");
  if (langLabel) langLabel.textContent = getIdioma().toUpperCase();
}