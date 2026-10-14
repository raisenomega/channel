/**
 * HUB by Raisen — Pinta la vista del shell y conecta la navegación.
 */
import type { HUBApp } from "./app.ts";
import { toggleTema, toggleWhiteLabel, getWhiteLabel } from "./interfaz.ts";
import { conectarHandlersCanales } from "./channel-handlers.ts";
import { conectarHandlersIntegraciones } from "./integrations-view.ts";
import { registrarVista } from "./main-state.ts";
import { repintarVista, sincronizarNav, cablearNavegacion } from "./main-nav.ts";
import { instalarOpenConversation } from "./main-conversation.ts";

// Pinta la vista actual en el area #app y conecta la navegacion del shell.
export function renderVista(root: HTMLElement, app: HUBApp): void {
  registrarVista(root, app);
  root.innerHTML = app.renderCurrentTab();
  cablearNavegacion(root, app);
  // Dispatcher global para botones renderizados dentro de #app.
  (globalThis as Record<string, unknown>).handleAction = (
    action: string,
    params?: Record<string, unknown>,
  ) => {
    app.handleAction(action, params);
    repintarVista();
    sincronizarNav(app);
  };
  const themeSwitch = document.querySelector<HTMLButtonElement>("[data-settings-theme]");
  themeSwitch?.addEventListener("click", () => toggleTema());
  const wlSwitch = document.querySelector<HTMLButtonElement>("[data-settings-white-label]");
  wlSwitch?.addEventListener("click", () => {
    toggleWhiteLabel();
    if (wlSwitch) {
      wlSwitch.className = wlSwitch.className.replace(/\b(?:on|off)\b/g, getWhiteLabel() ? "on" : "off");
    }
  });
  // Handlers globales para acciones renderizadas en #app.
  (globalThis as Record<string, unknown>).toggleFilter = (_tipo: string, valor: string) => {
    if (_tipo === "status") app.toggleFiltroEstado(valor);
    else if (_tipo === "sla") app.toggleFiltroSLA();
    else app.toggleFiltroCanal(valor);
    repintarVista();
  };
  (globalThis as Record<string, unknown>).toggleFilterClean = () => {
    app.toggleFiltroClean();
    repintarVista();
  };
  conectarHandlersCanales(() => repintarVista());
  conectarHandlersIntegraciones(() => repintarVista());
  instalarOpenConversation(app);
}