/**
 * HUB by Raisen — Cableado de navegación y repintado del shell.
 */
import type { HUBApp } from "./app.ts";
import type { TabId } from "./types.ts";
import { auth } from "./auth-client.ts";
import { cargarMetricasAgente } from "./agent-metrics-client.ts";
import { raizActual, appActual } from "./main-state.ts";

export function repintarVista(): void {
  if (raizActual && appActual) {
    raizActual.innerHTML = appActual.renderCurrentTab();
    cablearNavegacion(raizActual, appActual);
  }
}

export function sincronizarNav(app: HUBApp): void {
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const actual = app.currentTab();
  tabButtons.forEach((b) => {
    b.setAttribute("aria-selected", b.dataset.tab === actual ? "true" : "false");
  });
}

export function cablearNavegacion(root: HTMLElement, app: HUBApp): void {
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  tabButtons.forEach((btn) => {
    btn.onclick = () => {
      const tab = btn.dataset.tab as TabId;
      app.handleAction("navigate", { tab });
      tabButtons.forEach((b) => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      root.innerHTML = app.renderCurrentTab();
      dispararCargaMetricasAgente(app);
    };
  });
}

/** Carga las metricas reales del agente desde la DB y repinta la vista activa. */
export function dispararCargaMetricasAgente(app: HUBApp): void {
  if (app.currentTab() !== "agent") return;
  const sesion = auth.leer();
  if (!sesion) return;
  void cargarMetricasAgente(sesion).then(() => repintarVista());
}