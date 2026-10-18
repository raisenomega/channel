/**
 * HUB by Raisen — O-3: pagina de retorno del popup OAuth. Notifica a la pestaña padre via
 * BroadcastChannel 'zernio-oauth' (+ fallback localStorage) y cierra el popup. C4 <=75.
 */
import { useEffect } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { logOauth, rememberReqId } from "@/lib/oauth-telemetry";

export const ZernioReturnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/zernio/return",
  component: ZernioReturn,
});

function ZernioReturn() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const req = q.get("req") ?? "-";
    const status = q.get("status") ?? "";
    rememberReqId(req);
    logOauth("zernio-return", req, `mounted status=${status}`);
    const msg = { source: "hub", status, platform: q.get("platform") ?? "", req };
    try { const bc = new BroadcastChannel("zernio-oauth"); bc.postMessage(msg); bc.close(); logOauth("zernio-return", req, "emitted BroadcastChannel ch=zernio-oauth"); } catch { /* no-op */ }
    try { localStorage.setItem("zernio-oauth", JSON.stringify({ ...msg, ts: Date.now() })); } catch { /* no-op */ }
    const tmr = setTimeout(() => { logOauth("zernio-return", req, "window.close()"); try { window.close(); } catch { /* no-op */ } }, 500);
    return () => clearTimeout(tmr);
  }, []);
  return <div className="view"><p className="text-sm text-muted-foreground">Procesando conexión…</p></div>;
}
