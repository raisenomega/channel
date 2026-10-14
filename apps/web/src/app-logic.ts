/**
 * HUB by Raisen — Render de pestaña y dispatch de acciones del shell.
 */
import type { PageState, TabId, InboxItem, AppContext, SafeSnapshot } from "./types.ts";
import { cycleMode, navigate, popSubPage } from "./navigation.ts";
import { renderTab } from "./tab-router.ts";

export function renderCurrentTab(
  state: PageState,
  context: AppContext,
  inbox: InboxItem[],
  safe: SafeSnapshot | null,
  filtroCanal: string | null,
  filtroEstado: string | null,
  filtroSLA: boolean | null,
): string {
  return renderTab(state.currentTab, context, inbox, safe, filtroCanal, filtroEstado, filtroSLA);
}

export function handleAction(
  state: PageState,
  action: string,
  params?: Record<string, unknown>,
): PageState {
  switch (action) {
    case "cycleMode": return cycleMode(state);
    case "navigate": return navigate(state, params?.tab as TabId ?? "inbox");
    case "back": return popSubPage(state);
    default: return state;
  }
}