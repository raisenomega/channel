/**
 * HUB by Raisen — U-2 (Compuerta #120): ruta frontend en el path EXACTO al que Zernio redirige
 * (/channels/zernio/callback). Antes el SPA no tenia esta ruta -> 404 de HUB -> OAuth nunca
 * completaba aunque el backend estuviera correcto. Esta ruta REENVIA el callback al handler backend
 * (que verifica el state firmado + stashea; la verificacion sigue server-side, nunca en el cliente).
 * Guard anti-loop: solo reenvia si el backend es un origen DISTINTO (si no, error honesto). C4 <=75.
 */
import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { getHubApiUrl } from "@/lib/supabase/config";

export const ZernioCallbackForwardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/zernio/callback",
  component: ZernioCallbackForward,
});

function backendOrigin(base: string): string {
  try { return new URL(base).origin; } catch { return ""; }
}

export function ZernioCallbackForward() {
  const [error, setError] = useState(false);
  useEffect(() => {
    const search = window.location.search;
    const step = new URLSearchParams(search).get("step") ?? "";
    const hasState = new URLSearchParams(search).get("st");
    console.info(`[zernio-return] route hit, path=/channels/zernio/callback, step=${step}`);
    const origin = backendOrigin(getHubApiUrl());
    if (!hasState || !origin || origin === window.location.origin) { setError(true); return; }
    const target = `${getHubApiUrl()}/channels/zernio/callback${search}`;
    console.info(`[zernio-return] forwarding to backend endpoint=${origin}/channels/zernio/callback`);
    window.location.replace(target);
  }, []);

  if (error) {
    return (
      <div className="view" data-testid="zernio-callback-error">
        <div className="mx-auto mt-10 max-w-sm rounded-2xl glass-card p-5 text-center">
          <p className="mb-3 text-sm text-critical">No se pudo completar la conexión. Vuelve a intentarlo.</p>
          <a href="/channels" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-background">Volver a Canales</a>
        </div>
      </div>
    );
  }
  return (
    <div className="view" data-testid="zernio-callback-loading">
      <p className="mt-10 text-center text-sm text-muted-foreground">Procesando conexión…</p>
    </div>
  );
}
