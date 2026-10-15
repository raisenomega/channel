/**
 * HUB by Raisen — Cliente HTTP tipado para Meta WhatsApp Cloud API.
 * Sin SDKs externos. Usa fetch directo a graph.facebook.com.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppContent } from "../domain/message-content.vo.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

const BASE = "https://graph.facebook.com";

interface CloudApiSendResponse {
  readonly messaging_product: "whatsapp";
  readonly messages?: Array<{ id: string }>;
  readonly error?: { message: string; code: number };
}

function serializarContenido(content: WhatsAppContent): Record<string, unknown> {
  if (content.type === "text") return { type: "text", text: { body: (content as { body: string }).body, preview_url: (content as { previewUrl?: boolean }).previewUrl ?? false } };
  return { type: content.type };
}

export class WhatsAppCloudApiClient {
  async enviar(toPhone: string, content: WhatsAppContent, accessToken: string, phoneNumberId: string): Promise<Result<{ wamid: string }, string>> {
    const version = getEnv("META_WHATSAPP_API_VERSION") ?? "v22.0";
    const url = `${BASE}/${version}/${encodeURIComponent(phoneNumberId)}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: toPhone, ...serializarContenido(content) }),
      });
      const body = (await res.json()) as CloudApiSendResponse;
      if (!res.ok || body.error) return err(body.error?.message ?? `http_${res.status}`);
      const wamid = body.messages?.[0]?.id ?? "";
      if (!wamid) return err("sin_wamid_en_respuesta");
      return ok({ wamid });
    } catch (e) { return err(String(e)); }
  }

  async marcarLeido(messageId: string, accessToken: string, phoneNumberId: string): Promise<Result<void, string>> {
    const version = getEnv("META_WHATSAPP_API_VERSION") ?? "v22.0";
    const url = `${BASE}/${version}/${encodeURIComponent(phoneNumberId)}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
      });
      if (!res.ok) return err(`http_${res.status}`);
      return ok(undefined);
    } catch (e) { return err(String(e)); }
  }
}