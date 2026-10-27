/**
 * HUB by Raisen — Hotfix P bloque 4: parser del webhook REAL de Zernio (payloads de prod confirmados).
 * Acepta message.received (inbound) y message.sent (outbound). El CONTACTO es el participante de la
 * conversacion (igual para in/out). content = message.text, o descriptivo del adjunto si text=null
 * (Reel/Video/Imagen/...). Tenant: account.profileId (primary) / account.id (fallback, Issue C). C4 <=75.
 */
export interface ZernioInbound {
  readonly profileId: string;            // account.profileId -> tenants.zernio_profile_id (primary)
  readonly accountId: string;            // account.id -> channel_connections.zernio_account_id (fallback)
  readonly channel: string;              // message.platform (instagram/facebook/whatsapp/...)
  readonly content: string;              // message.text, o "[Reel]"/"[Video]"/... si es media
  readonly hasAttachments: boolean;
  readonly providerMessageId: string;    // message.id (idempotencia)
  readonly direction: "inbound" | "outbound";
  readonly contactExternalId: string;    // conversation.participantId (estable, mismo hilo in/out)
  readonly contactName: string;          // conversation.participantName
  readonly contactPhone: string;         // WhatsApp: el participantId ES el telefono; otros canales: vacio
  readonly mediaUrl: string;             // url del adjunto en Zernio (exige Bearer -> proxy backend)
  readonly mediaType: string;            // image/audio/video/document/sticker
  readonly mediaMime: string;            // ej. audio/ogg; codecs=opus
  readonly providerConversationId: string; // #1: conversation.id de Zernio -> ruta del envío real
}

function describirMedia(atts: readonly Record<string, unknown>[]): string {
  const a = atts[0];
  if (!a) return "";
  if (a["originalType"] === "ig_reel") return "[Reel]";
  const map: Record<string, string> = { video: "[Video]", image: "[Imagen]", audio: "[Audio]", document: "[Documento]", sticker: "[Sticker]" };
  return map[String(a["type"])] ?? "[Adjunto]";
}

export function parseZernioMessage(payload: unknown): ZernioInbound | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (p["event"] !== "message.received" && p["event"] !== "message.sent") return null;
  const m = (p["message"] ?? {}) as Record<string, unknown>;
  const acct = (p["account"] ?? {}) as Record<string, unknown>;
  const conv = (p["conversation"] ?? {}) as Record<string, unknown>;
  const sender = (m["sender"] ?? {}) as Record<string, unknown>;
  const providerMessageId = String(m["id"] ?? "");
  const profileId = String(acct["profileId"] ?? "");
  if (!providerMessageId || !profileId) return null;
  const atts = Array.isArray(m["attachments"]) ? (m["attachments"] as Record<string, unknown>[]) : [];
  const a0 = (atts[0] ?? {}) as Record<string, unknown>;
  const text = m["text"] != null ? String(m["text"]) : "";
  const direction = (p["event"] === "message.sent" || String(m["direction"]) === "outgoing") ? "outbound" : "inbound"; // evento manda: el eco del negocio nunca se trata como entrante
  // #3: el contacto es el participante. En SALIENTE el sender es el NEGOCIO -> jamás usarlo como nombre
  // del contacto; solo en entrante el sender es la persona. Sin nombre -> neutral "Cliente" (no el negocio).
  const senderName = direction === "inbound" ? (sender["name"] ?? sender["username"]) : null;
  const fallbackId = direction === "inbound" ? String(sender["id"] ?? "") : ""; // en saliente sender = NEGOCIO: jamas como contacto
  const contactExternalId = String(conv["participantId"] ?? "") || fallbackId;
  if (!contactExternalId) return null; // sin id confiable del contacto: no ingerir (evita 1 contacto por mensaje y colisiones de hilo)
  return {
    profileId,
    accountId: String(acct["id"] ?? acct["accountId"] ?? ""),
    channel: String(m["platform"] ?? acct["platform"] ?? ""),
    content: text || describirMedia(atts),
    hasAttachments: atts.length > 0,
    providerMessageId,
    direction,
    contactExternalId,
    contactName: String(conv["participantName"] ?? senderName ?? "Cliente"),
    contactPhone: String(m["platform"] ?? acct["platform"] ?? "") === "whatsapp" ? contactExternalId.replace(/[^\d+]/g, "") : "",
    mediaUrl: String(a0["url"] ?? ""),
    mediaType: String(a0["type"] ?? ""),
    mediaMime: String(((a0["payload"] ?? {}) as Record<string, unknown>)["mimeType"] ?? ""),
    providerConversationId: String(conv["id"] ?? ""),
  };
}
