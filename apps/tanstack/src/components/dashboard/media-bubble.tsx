/**
 * HUB by Raisen — Burbuja de media: baja el adjunto via el proxy backend (JWT) como data URL base64 y
 * lo renderiza (imagen/audio/video). El adjunto de Zernio exige API key, por eso pasa por el proxy. Si
 * falla, cae al texto placeholder ([Imagen]/[Audio]). C4 <=75.
 */
import { useEffect, useState } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { ImageLightbox } from "./image-lightbox";

export function MediaBubble({ messageId, kind, fallback }: { messageId: string; kind: string; fallback: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [zoom, setZoom] = useState(false); // clic en la foto -> modal con zoom
  useEffect(() => {
    let alive = true;
    const tid = resolveTenantId();
    if (!tid) { setErr(true); return; }
    void (async () => {
      try {
        const res = await apiFetch(`/tenants/${encodeURIComponent(tid)}/media/${encodeURIComponent(messageId)}`);
        if (!res.ok) { if (alive) setErr(true); return; }
        const d = (await res.json()) as { dataUrl?: string };
        if (alive) { if (d.dataUrl) setUrl(d.dataUrl); else setErr(true); }
      } catch { if (alive) setErr(true); }
    })();
    return () => { alive = false; };
  }, [messageId]);
  if (err) return <p>{fallback}</p>;
  if (!url) return <p className="opacity-60">{fallback}</p>;
  if (kind === "image") return (
    <>
      <img src={url} alt="" onClick={() => setZoom(true)} className="max-w-full rounded-lg" style={{ maxHeight: 280, cursor: "zoom-in" }} />
      {zoom ? <ImageLightbox src={url} onClose={() => setZoom(false)} /> : null}
    </>
  );
  if (kind === "audio") return <audio controls src={url} className="max-w-full" />;
  if (kind === "video") return <video controls src={url} className="max-w-full rounded-lg" style={{ maxHeight: 280 }} />;
  return <a href={url} download className="underline">{fallback}</a>;
}
