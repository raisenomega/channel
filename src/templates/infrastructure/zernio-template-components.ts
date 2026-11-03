/**
 * HUB by Raisen — Arma el array components[] para POST /v1/whatsapp/templates de Zernio con la forma
 * VERIFICADA (crate zernio en docs.rs): header{format:text|image, text|example.header_handle} -> body ->
 * buttons{type:url}. Para foto, header_handle lleva una URL publica y Zernio sube la media a WhatsApp. C4 <=75.
 */
export interface ZernioHeaderIn {
  readonly type: string; // "text" | "image" | "none" | ...
  readonly content?: string;
}
export interface ZernioButtonIn {
  readonly type: string; // "url" | "phone_number" | "quick_reply"
  readonly text: string;
  readonly url?: string;
}

export function construirComponents(
  body: string,
  header?: ZernioHeaderIn,
  buttons?: readonly ZernioButtonIn[],
): Array<Record<string, unknown>> {
  const comps: Array<Record<string, unknown>> = [];
  if (header && header.content && header.type === "text") {
    comps.push({ type: "header", format: "text", text: header.content });
  } else if (header && header.content && header.type === "image") {
    comps.push({ type: "header", format: "image", example: { header_handle: [header.content] } });
  }
  comps.push({ type: "body", text: body }); // body siempre, orden Meta: header -> body -> buttons
  const url = (buttons ?? []).filter((b) => b.type === "url" && b.url).map((b) => ({ type: "url", text: b.text, url: b.url }));
  if (url.length > 0) comps.push({ type: "buttons", buttons: url });
  return comps;
}
