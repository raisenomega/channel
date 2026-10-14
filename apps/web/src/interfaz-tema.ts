/**
 * HUB by Raisen — Preferencia de tema (dark/light).
 */
import { KEY_TEMA, leer, guardar, notificar } from "./interfaz-utils.ts";

export type Tema = "dark" | "light";

export function getTema(): Tema {
  if (typeof document !== "undefined") {
    const t = document.documentElement.getAttribute("data-theme");
    return t === "light" ? "light" : "dark";
  }
  return (leer(KEY_TEMA, "dark") as Tema);
}

export function setTema(tema: Tema): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", tema);
  }
  guardar(KEY_TEMA, tema);
  notificar();
}

export function toggleTema(): Tema {
  const nuevo = getTema() === "dark" ? "light" : "dark";
  setTema(nuevo);
  return nuevo;
}