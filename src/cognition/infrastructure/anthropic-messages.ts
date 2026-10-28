/**
 * HUB by Raisen — Construye los `messages` del cuerpo Anthropic. Si params.images trae imagenes (base64),
 * las adjunta como bloques `image` al ULTIMO mensaje del usuario (vision). Sin imagenes = texto plano.
 * C4 <=75. Sin any.
 */
import type { AICompletionParams } from "../domain/ai-provider.ts";

export function construirMensajes(params: AICompletionParams): Array<{ role: string; content: unknown }> {
  const msgs = params.messages.map((m) => ({ role: m.role, content: m.content as unknown }));
  const imgs = params.images ?? [];
  const last = msgs[msgs.length - 1];
  if (imgs.length && last) {
    last.content = [
      { type: "text", text: String(last.content) },
      ...imgs.map((im) => ({ type: "image", source: { type: "base64", media_type: im.mediaType, data: im.dataBase64 } })),
    ];
  }
  return msgs;
}
