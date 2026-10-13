import type { PageState, TabId, OperationMode, SubPage } from "./types.ts";

export function createInitialState(): PageState {
  return {
    currentTab: "inbox",
    subStack: [],
    mode: "ecosystem",
    theme: "light",
    language: "es",
    whiteLabel: false,
  };
}

export function cycleMode(state: PageState): PageState {
  const modes: OperationMode[] = ["lite", "ecosystem", "autonomous"];
  const next = (modes.indexOf(state.mode) + 1) % modes.length;
  return { ...state, mode: modes[next] ?? "lite" };
}

export function toggleTheme(state: PageState): PageState {
  return { ...state, theme: state.theme === "light" ? "dark" : "light" };
}

export function navigate(state: PageState, tab: TabId): PageState {
  return { ...state, currentTab: tab, subStack: [] };
}

export function pushSubPage(state: PageState, sub: SubPage): PageState {
  return { ...state, subStack: [...state.subStack, sub] };
}

export function popSubPage(state: PageState): PageState {
  const subStack = state.subStack.slice(0, -1);
  return { ...state, subStack };
}

export function getErrorMessage(state: PageState, key: string): string {
  const msgs: Record<string, Record<string, string>> = {
    es: {
      "inbox.title": "Bandeja de entrada",
      "inbox.empty": "No hay conversaciones activas",
      "channel.connected": "Canal conectado exitosamente",
      "channel.disconnected": "Canal desconectado",
      "common.save": "Guardar",
      "common.cancel": "Cancelar",
      "common.error": "Error",
      "common.loading": "Cargando...",
      "agent.provider": "Proveedor IA",
      "agent.was_correct": "Correcto",
      "agent.confidence": "Confianza",
      "agent.indistinguishability": "Indistinguibilidad",
    },
    en: {
      "inbox.title": "Inbox",
      "inbox.empty": "No active conversations",
      "channel.connected": "Channel connected successfully",
      "channel.disconnected": "Channel disconnected",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.error": "Error",
      "common.loading": "Loading...",
      "agent.provider": "AI Provider",
      "agent.was_correct": "Correct",
      "agent.confidence": "Confidence",
      "agent.indistinguishability": "Indistinguishability",
    },
  };
  return msgs[state.language]?.[key] ?? key;
}