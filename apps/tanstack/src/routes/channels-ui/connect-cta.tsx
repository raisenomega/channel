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
const POPUP_GRACE_MS = 3_000; // V-vig-3: tras cerrarse el popup, margen para que el relay confirme exito
const stop = (e: { stopPropagation: () => void }): void => e.stopPropagation();
type Timer = ReturnType<typeof setTimeout>;

export function ConnectCta({ language, kind }: { language: Idioma; kind: string }) {
  const [awaiting, setAwaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<Timer | null>(null);
  const grace = useRef<Timer | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiar = (): void => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (grace.current) { clearTimeout(grace.current); grace.current = null; }
    if (poll.current) { clearInterval(poll.current); poll.current = null; }
  };
  const fallo = (): void => { limpiar(); setAwaiting(false); setTimedOut(true); };
  useEffect(() => limpiar, []);

  async function abrir() {
    setErr(null); setTimedOut(false);
    const r = await obtenerConnectUrl(kind);
    if (!r.ok) { setErr(t(language, "channels.connectError")); return; }
    const popup = window.open(r.value, "_blank", "noopener,noreferrer,width=600,height=720");
    setAwaiting(true);
    limpiar();
    timer.current = setTimeout(fallo, OAUTH_TIMEOUT_MS); // T-4 60s (fallback duro)
    // V-vig-3: popup cerrado sin exito (user lo cierra / crash) -> feedback rapido. En EXITO el popup
    // tambien se autocierra, pero el relay refetchea y desmonta este CTA antes de que venza la gracia.
    if (popup) poll.current = setInterval(() => {
      if (!popup.closed) return;
      if (poll.current) { clearInterval(poll.current); poll.current = null; }
      grace.current = setTimeout(fallo, POPUP_GRACE_MS);
    }, 500);
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
