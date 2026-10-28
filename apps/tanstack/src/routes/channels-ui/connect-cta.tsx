/**
 * HUB by Raisen — O-2 + W (same-tab): CTA "Conectar" por card. OAuth en la MISMA pestaña
 * (window.location.href, NO popup): un window.open DESPUES de `await` lo BLOQUEA el navegador
 * (sobre todo en movil) -> el popup nunca abria = "no conecta". El retorno lo maneja
 * /channels?oauth=<status> (el backend 302 de vuelta a la misma pestaña). P1: el verde real lo
 * confirma el refetch de /channels, no este boton. Sin popup/BroadcastChannel/window.close. C4 <=75.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerConnectUrl } from "@/lib/channels-client";
import { t, type Idioma } from "@/lib/i18n";

const stop = (e: { stopPropagation: () => void }): void => e.stopPropagation();

export function ConnectCta({ language, kind, conectado = false }: { language: Idioma; kind: string; conectado?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function abrir() {
    setErr(null); setBusy(true);
    const r = await obtenerConnectUrl(kind);
    if (!r.ok) { setErr(t(language, "channels.connectError")); setBusy(false); return; }
    // Navegacion de pagina completa (NO popup): no se bloquea aunque venga tras await; sirve en movil.
    window.location.href = r.value;
  }

  // conectado -> "Reconectar" discreto (siempre disponible, aunque el chip ya este verde: cubre el
  // caso Meta 100/33 en que Zernio aun lista la cuenta pero ya no puede leerla/enviar).
  return (
    <div onClick={stop} onKeyDown={stop}>
      <Button variant={conectado ? "ghost" : "primary"} size="sm" disabled={busy} onClick={() => void abrir()}>
        {busy ? t(language, "channels.awaitingVerify") : t(language, conectado ? "channels.reconnect" : "channels.connect")}
      </Button>
      {err ? <p className="mt-1 text-xs text-critical">{err}</p> : null}
    </div>
  );
}
