/**
 * HUB by Raisen — Preferencias de interfaz (tema claro/oscuro + idioma ES/EN).
 * Fueente unica del estado de preferencias, persistida en localStorage.
 * Emite el CustomEvent "hub:ui-changed" cuando alguna preferencia cambia;
 * la app se suscribe para re-renderizar la vista con el idioma/tema vigente.
 */
import type { Idioma } from "./i18n.ts";

export type Tema = "dark" | "light";

const KEY_TEMA = "hub.tema";
const KEY_IDIOMA = "hub.idioma";
export const EVENTO_UI = "hub:ui-changed";

let temaActual: Tema = "dark";
let idiomaActual: Idioma = "es";

function leerTema(): Tema {
  try {
    const v = localStorage.getItem(KEY_TEMA);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function leerIdioma(): Idioma {
  try {
    const v = localStorage.getItem(KEY_IDIOMA);
    return v === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

function notificar(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_UI));
}

function aplicarTema(tema: Tema): void {
  temaActual = tema;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", tema);
    const icon = document.querySelector<SVGPathElement>("[data-theme-icon]");
    if (icon) icon.setAttribute("d", tema === "dark" ? MOON_PATH : SUN_PATH);
  }
  try {
    localStorage.setItem(KEY_TEMA, tema);
  } catch {
    // ignora
  }
}

// Simbolos del icono de tema (sin libreria, SVG inline).
const SUN_PATH = "M11 1v2M11 19v2M1 11h2M19 11h2M3.5 3.5 5 5M17 17l1.5 1.5M3.5 18.5 5 17M17 5l1.5-1.5M11 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8";
const MOON_PATH = "M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z";

export function getTema(): Tema {
  return temaActual;
}

export function getIdioma(): Idioma {
  return idiomaActual;
}

export function setTema(tema: Tema): void {
  if (tema === temaActual) return;
  aplicarTema(tema);
  notificar();
}

export function toggleTema(): Tema {
  const nuevo = temaActual === "dark" ? "light" : "dark";
  aplicarTema(nuevo);
  notificar();
  return nuevo;
}

export function toggleIdioma(): Idioma {
  idiomaActual = idiomaActual === "es" ? "en" : "es";
  try {
    localStorage.setItem(KEY_IDIOMA, idiomaActual);
  } catch {
    // ignora
  }
  notificar();
  return idiomaActual;
}

export function suscribirAlCambio(handler: () => void): () => void {
  window.addEventListener(EVENTO_UI, handler);
  return () => window.removeEventListener(EVENTO_UI, handler);
}

/** Aplica el tema guardado y cablea los botones del shell. */
export function iniciarControlesShell(): void {
  temaActual = leerTema();
  idiomaActual = leerIdioma();
  aplicarTema(temaActual);

  const themeBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  themeBtn?.addEventListener("click", () => {
    toggleTema();
  });

  const langBtn = document.querySelector<HTMLButtonElement>("[data-lang-toggle]");
  const langLabel = document.querySelector<HTMLElement>("[data-lang-label]");
  const actualizarLabel = () => {
    if (langLabel) langLabel.textContent = leerIdioma().toUpperCase();
  };
  langBtn?.addEventListener("click", () => {
    toggleIdioma();
    actualizarLabel();
  });
  actualizarLabel();
}