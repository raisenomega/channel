/**
 * HUB by Raisen — W (same-tab): retorno del OAuth en la MISMA pestaña (sin popup/BroadcastChannel).
 * El backend hace 302 de vuelta a /channels?oauth=<status>. Aqui se lee al montar: needs_page -> abre
 * el page-picker FB; connected -> refetch (el verde real). Limpia el query param (history.replaceState)
 * para no re-disparar en re-render/refresh. P1: el verde lo da el fetch real, no el param. C4 <=75.
 */
import { useEffect } from "react";
import { reconciliarCanales } from "@/lib/channels-client";

export function useOauthReturn(refetch: () => void, setNeedsPage: (v: boolean) => void): void {
  useEffect(() => {
    // Self-heal: en CADA visita reconcilia channel_connections con las cuentas reales de Zernio y
    // refresca -> el chip sostiene "conectado" aunque el redirect del callback no haya persistido.
    void reconciliarCanales().then(refetch);
    try {
      const oauth = new URLSearchParams(window.location.search).get("oauth");
      if (!oauth) return;
      window.history.replaceState({}, "", window.location.pathname); // limpia antes de actuar (idempotente)
      if (oauth === "needs_page") setNeedsPage(true); // "connected" ya lo cubre el reconcile+refetch
    } catch { /* no-op */ }
  }, [refetch, setNeedsPage]);
}
