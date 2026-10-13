/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Importa el sistema de estilos OMEGA (entrada unica) y monta la UI.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";

interface MountTarget {
  innerHTML: string;
}

export function mountHUB(root: MountTarget): void {
  const app = new HUBApp();
  root.innerHTML = app.renderCurrentTab();
}

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) mountHUB(el);
}