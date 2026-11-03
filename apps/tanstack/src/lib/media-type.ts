/**
 * HUB by Raisen — Deriva el tipo de media de un mensaje para renderizarlo (imagen/audio/video/document)
 * AUNQUE content_type venga "text" con un adjunto. Caso real verificado: muchos adjuntos quedaron con
 * content_type="text" + media_url + mime de imagen -> el chat los mostraba como "[Adjunto]" en vez de la
 * foto. Si hay media_url, el mime manda. Asi se ven TODAS las fotos en cualquier chat. C4 <=75. Sin any.
 */
const MEDIA = ["image", "audio", "video", "document", "sticker"];

export function tipoMedia(contentType: string | null | undefined, mediaMime?: string | null, mediaUrl?: string | null): string {
  const ct = contentType ?? "text";
  if (MEDIA.includes(ct)) return ct;
  if (mediaUrl && mediaMime) {
    if (mediaMime.startsWith("image/")) return "image";
    if (mediaMime.startsWith("audio/")) return "audio";
    if (mediaMime.startsWith("video/")) return "video";
    return "document";
  }
  return ct;
}
