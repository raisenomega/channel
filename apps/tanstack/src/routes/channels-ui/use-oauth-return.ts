/**
 * HUB by Raisen — W (same-tab): retorno del OAuth en la MISMA pestaña (sin popup/BroadcastChannel).
 * El backend hace 302 de vuelta a /channels?oauth=<status>. Aqui se lee al montar: needs_page -> abre
 * el page-picker FB; connected -> refetch (el verde real). Limpia el query param (history.replaceState)
 * para no re-disparar en re-render/refresh. P1: el verde lo da el fetch real, no el param. C4 <=75.
 */
import { useEffect } from "react";

export function useOauthReturn(refetch: () => void, setNeedsPage: (v: boolean) => void): void {
  useEffect(() => {
    try {
      const oauth = new URLSearchParams(window.location.search).get("oauth");
      if (!oauth) return;
      window.history.replaceState({}, "", window.location.pathname); // limpia antes de actuar (idempotente)
      if (oauth === "connected") refetch();
      else if (oauth === "needs_page") setNeedsPage(true);
    } catch { /* no-op */ }
  }, [refetch, setNeedsPage]);
}
