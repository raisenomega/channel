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
  const text = m["text"] != null ? String(m["text"]) : "";
  return {
    profileId,
    accountId: String(acct["id"] ?? acct["accountId"] ?? ""),
    channel: String(m["platform"] ?? acct["platform"] ?? ""),
    content: text || describirMedia(atts),
    hasAttachments: atts.length > 0,
    providerMessageId,
    direction: String(m["direction"]) === "outgoing" ? "outbound" : "inbound",
    contactExternalId: String(conv["participantId"] ?? sender["id"] ?? providerMessageId),
    contactName: String(conv["participantName"] ?? sender["name"] ?? sender["username"] ?? "Contacto"),
  };
}
