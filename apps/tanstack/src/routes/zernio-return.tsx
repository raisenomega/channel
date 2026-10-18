/**
 * HUB by Raisen — O-3: pagina de retorno del popup OAuth. Notifica a la pestaña padre via
 * BroadcastChannel 'zernio-oauth' (+ fallback localStorage) y cierra el popup. C4 <=75.
 */
import { useEffect } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";

export const ZernioReturnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/zernio/return",
  component: ZernioReturn,
});

function ZernioReturn() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const msg = { source: "hub", status: q.get("status") ?? "", platform: q.get("platform") ?? "" };
    try { const bc = new BroadcastChannel("zernio-oauth"); bc.postMessage(msg); bc.close(); } catch { /* no-op */ }
    try { localStorage.setItem("zernio-oauth", JSON.stringify({ ...msg, ts: Date.now() })); } catch { /* no-op */ }
    const tmr = setTimeout(() => { try { window.close(); } catch { /* no-op */ } }, 500);
    return () => clearTimeout(tmr);
  }, []);
  return <div className="view"><p className="text-sm text-muted-foreground">Procesando conexión…</p></div>;
}
