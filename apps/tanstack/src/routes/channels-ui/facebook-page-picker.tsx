/**
 * HUB by Raisen — O-4: modal del page picker de Facebook. Abre al recibir needs_page del
 * BroadcastChannel; lista las paginas (pending-pages), el user elige, POST select-page.
 * P1: el verde real lo confirma el refetch de /channels, no este modal. C4 <=75.
 */
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { obtenerPaginasFb, seleccionarPaginaFb, type FbPage } from "@/lib/channels-client/fb-pages";
import { logOauth, readReqId } from "@/lib/oauth-telemetry";
import { t, type Idioma } from "@/lib/i18n";

export function FacebookPagePicker({ language, onClose, onConnected }: {
  language: Idioma; onClose: () => void; onConnected: () => void;
}) {
  const [pages, setPages] = useState<FbPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [reqId] = useState(() => readReqId());

  useEffect(() => { void (async () => {
    logOauth("fb-picker", reqId, "GET pending-pages");
    const p = await obtenerPaginasFb(reqId);
    logOauth("fb-picker", reqId, `received ${p.length} pages`);
    setPages(p); setLoading(false);
  })(); }, [reqId]);

  async function select(id: string) {
    setSaving(id);
    logOauth("fb-picker", reqId, `POST select-page pageId=${id}`);
    const okSel = await seleccionarPaginaFb(id, reqId);
    setSaving(null);
    logOauth("fb-picker", reqId, `select-page ${okSel ? "OK -> connected" : "FAILED"}`);
    if (okSel) onConnected();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader><CardTitle>{t(language, "channels.fbPickerTitle")}</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">…</p>
            : pages.length === 0 ? <p className="text-sm text-muted-foreground">{t(language, "channels.fbNoPages")}</p>
            : pages.map((p) => (
              <Button key={p.id} variant="ghost" className="w-full justify-between" disabled={saving !== null} onClick={() => void select(p.id)}>
                <span>{p.name}</span>
                <span className="text-xs">{saving === p.id ? "…" : t(language, "channels.fbConnectPage")}</span>
              </Button>
            ))}
        </CardBody>
      </Card>
    </div>
  );
}
