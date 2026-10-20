/**
 * HUB by Raisen — Hotfix P bloque 2: parser del webhook REAL de Zernio `event=message.received`.
 * Zernio manda un objeto `message` UNICO (no array `messages[]`) + `account` (profileId -> tenant) +
 * `sender`. Devuelve los campos ya normalizados, o null si el shape no es un mensaje entrante. C4 <=75.
 */
export interface ZernioInbound {
  readonly profileId: string;      // account.profileId -> tenants.zernio_profile_id
  readonly channel: string;        // message.platform (instagram/facebook/...)
  readonly content: string;        // message.text
  readonly providerMessageId: string; // message.id (idempotencia)
  readonly direction: "inbound" | "outbound";
  readonly senderId: string;       // message.sender.id (externo, estable)
  readonly senderName: string;
}

export function parseZernioMessage(payload: unknown): ZernioInbound | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (p["event"] !== "message.received") return null;
  const m = (p["message"] ?? {}) as Record<string, unknown>;
  const acct = (p["account"] ?? {}) as Record<string, unknown>;
  const sender = (m["sender"] ?? {}) as Record<string, unknown>;
  const providerMessageId = String(m["id"] ?? "");
  const profileId = String(acct["profileId"] ?? "");
  if (!providerMessageId || !profileId) return null;
  return {
    profileId,
    channel: String(m["platform"] ?? acct["platform"] ?? ""),
    content: String(m["text"] ?? m["body"] ?? m["content"] ?? m["message"] ?? ""), // Issue B: campos alternativos de texto
    providerMessageId,
    direction: String(m["direction"]) === "incoming" ? "inbound" : "outbound",
    senderId: String(sender["id"] ?? providerMessageId),
    senderName: String(sender["name"] ?? sender["username"] ?? "Contacto"),
  };
}
