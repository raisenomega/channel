/**
 * HUB by Raisen — O-2 + T-4 (Compuerta #113): CTA "Conectar" por card. Abre el popup OAuth
 * (auth_url de Zernio) y marca awaiting. P1 HONESTIDAD: NUNCA afirma "conectado" por abrir el popup
 * (el verde real llega por el refetch tras el BroadcastChannel). T-4 recovery: timeout de 60s ->
 * "Conexion no completada" + reintentar; y Cancelar manual mientras espera (no bloquea). C4 <=75.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerConnectUrl } from "@/lib/channels-client";
import { t, type Idioma } from "@/lib/i18n";

const OAUTH_TIMEOUT_MS = 60_000;
const stop = (e: { stopPropagation: () => void }): void => e.stopPropagation();

export function ConnectCta({ language, kind }: { language: Idioma; kind: string }) {
  const [awaiting, setAwaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpiar = (): void => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => limpiar, []);

  async function abrir() {
    setErr(null); setTimedOut(false);
    const r = await obtenerConnectUrl(kind);
    if (!r.ok) { setErr(t(language, "channels.connectError")); return; }
    window.open(r.value, "_blank", "noopener,noreferrer,width=600,height=720");
    setAwaiting(true);
    limpiar();
    timer.current = setTimeout(() => { setAwaiting(false); setTimedOut(true); }, OAUTH_TIMEOUT_MS); // T-4
  }
  function cancelar() { limpiar(); setAwaiting(false); setTimedOut(false); }

  if (timedOut) {
    return (
      <div data-testid="connect-timeout" onClick={stop} onKeyDown={stop}>
        <p className="mb-1 text-xs text-critical">{t(language, "channels.connectTimeout")}</p>
        <Button variant="primary" onClick={() => void abrir()}>{t(language, "channels.retry")}</Button>
      </div>
    );
  }
  return (
    <div onClick={stop} onKeyDown={stop}>
      <Button variant="primary" disabled={awaiting} onClick={() => void abrir()}>
        {awaiting ? t(language, "channels.awaitingVerify") : t(language, "channels.connect")}
      </Button>
      {awaiting ? (
        <button type="button" data-testid="connect-cancel" className="ml-2 text-xs text-muted-foreground underline" onClick={cancelar}>
          {t(language, "channels.cancel")}
        </button>
      ) : null}
      {err ? <p className="mt-1 text-xs text-critical">{err}</p> : null}
    </div>
  );
}
