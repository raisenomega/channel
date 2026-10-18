/**
 * HUB by Raisen — O-3/O-4: relay del popup OAuth. Escucha el BroadcastChannel 'zernio-oauth':
 * 'connected' -> refetch (el verde real, P1); 'needs_page' -> abre el page picker FB. C4 <=75.
 */
import { useEffect } from "react";
import { logOauth } from "@/lib/oauth-telemetry";

export function useOauthRelay(refetch: () => void, setNeedsPage: (v: boolean) => void): void {
  useEffect(() => {
    try {
      const bc = new BroadcastChannel("zernio-oauth");
      bc.onmessage = (ev) => {
        const d = ev.data as { status?: string; req?: string } | null;
        const req = d?.req ?? "-";
        logOauth("main-tab", req, `received status=${d?.status ?? "?"}`);
        if (d?.status === "connected") refetch();
        else if (d?.status === "needs_page") { logOauth("main-tab", req, "opening FacebookPagePicker"); setNeedsPage(true); }
      };
      return () => bc.close();
    } catch { return undefined; }
  }, [refetch, setNeedsPage]);
}
