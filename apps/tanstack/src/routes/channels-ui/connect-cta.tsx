/**
 * HUB by Raisen — O-2: CTA "Conectar" por card. Abre el popup OAuth (auth_url de Zernio)
 * y marca awaitingVerify. P1 HONESTIDAD OMEGA: NUNCA afirma "conectado" por abrir el popup;
 * el verde real solo llega por el refetch de /channels tras el BroadcastChannel. C4 <=75.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerConnectUrl } from "@/lib/channels-client";
import { t, type Idioma } from "@/lib/i18n";

export function ConnectCta({ language, kind }: { language: Idioma; kind: string }) {
  const [awaiting, setAwaiting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setErr(null);
    const r = await obtenerConnectUrl(kind);
    if (!r.ok) { setErr(t(language, "channels.connectError")); return; }
    window.open(r.value, "_blank", "noopener,noreferrer,width=600,height=720");
    setAwaiting(true); // P1: solo "esperando"; el connected lo confirma el fetch real.
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Button variant="primary" disabled={awaiting} onClick={() => void onClick()}>
        {awaiting ? t(language, "channels.awaitingVerify") : t(language, "channels.connect")}
      </Button>
      {err ? <p className="mt-1 text-xs text-critical">{err}</p> : null}
    </div>
  );
}
