/**
 * HUB by Raisen — Preferencia de idioma y suscripción de cambios.
 */
import type { Idioma } from "./i18n.ts";
import { KEY_IDIOMA, EVENTO_UI, leer, guardar, notificar } from "./interfaz-utils.ts";

export function getIdioma(): Idioma {
  return leer(KEY_IDIOMA, "es") as Idioma;
}

export function toggleIdioma(): Idioma {
  const nuevo = getIdioma() === "es" ? "en" : "es";
  guardar(KEY_IDIOMA, nuevo);
  notificar();
  return nuevo;
}

export function suscribirAlCambio(handler: () => void): () => void {
  window.addEventListener(EVENTO_UI, handler);
  return () => window.removeEventListener(EVENTO_UI, handler);
}

/** Aplica el tema guardado y sincroniza el label de idioma. */
export function iniciarControlesShell(): void {
  const langLabel = document.querySelector<HTMLElement>("[data-lang-label]");
  if (langLabel) langLabel.textContent = getIdioma().toUpperCase();
}