/**
 * HUB by Raisen — Preferencia de white-label.
 */
import { KEY_WHITE_LABEL, leer, guardar, notificar } from "./interfaz-utils.ts";

export function getWhiteLabel(): boolean {
  return leer(KEY_WHITE_LABEL, "false") === "true";
}

export function setWhiteLabel(activo: boolean): void {
  guardar(KEY_WHITE_LABEL, activo ? "true" : "false");
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