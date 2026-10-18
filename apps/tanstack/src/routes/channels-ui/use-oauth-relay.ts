/**
 * HUB by Raisen — O-3/O-4: relay del popup OAuth. Escucha el BroadcastChannel 'zernio-oauth':
 * 'connected' -> refetch (el verde real, P1); 'needs_page' -> abre el page picker FB. C4 <=75.
 */
import { useEffect } from "react";

export function useOauthRelay(refetch: () => void, setNeedsPage: (v: boolean) => void): void {
  useEffect(() => {
    try {
      const bc = new BroadcastChannel("zernio-oauth");
      bc.onmessage = (ev) => {
        const s = (ev.data as { status?: string } | null)?.status;
        if (s === "connected") refetch(); else if (s === "needs_page") setNeedsPage(true);
      };
      return () => bc.close();
    } catch { return undefined; }
  }, [refetch, setNeedsPage]);
}
