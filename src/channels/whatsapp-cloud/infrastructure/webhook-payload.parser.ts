/**
 * HUB by Raisen — Parser del webhook entrante de Meta.
 * Convierte payload crudo en InboundMessage[].
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppContent } from "../domain/message-content.vo.ts";

export interface RawWebhookEntry {
  readonly id: string;
  readonly changes?: Array<{ field: string; value: Record<string, unknown> }>;
}

export interface ParsedInbound {
  readonly wamid: string;
  readonly fromPhone: string;
  readonly toPhone: string;
  readonly phoneNumberId: string;
  readonly content: WhatsAppContent;
  readonly timestamp: string;
}

export function parsearPayloadMeta(payload: Record<string, unknown>): Result<ParsedInbound[], string> {
  const object = payload.object as string | undefined;
  if (object !== "whatsapp_business_account") return err("object_no_whatsapp");
  const entries = payload.entry as RawWebhookEntry[] | undefined;
  if (!entries || entries.length === 0) return err("sin_entries");

  const resultados: ParsedInbound[] = [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      if (change.field !== "messages") continue;
      const value = change.value;
      const messages = value?.messages as Array<Record<string, unknown>> | undefined;
      if (!messages) continue;
      const metadata = value?.metadata as Record<string, unknown> | undefined;
      const phoneNumberId = String(metadata?.phone_number_id ?? "");
      const toPhone = String(metadata?.display_phone_number ?? "");

      for (const msg of messages) {
        const wamid = String(msg.id ?? "");
        const fromPhone = String(msg.from ?? "");
        const msgType = String(msg.type ?? "text");
        if (!wamid || !fromPhone) continue;

        resultados.push({
          wamid,
          fromPhone,
          toPhone,
          phoneNumberId,
          content: { type: msgType, body: String((msg.text as Record<string, unknown> | undefined)?.body ?? "") } as WhatsAppContent,
          timestamp: String(msg.timestamp ?? new Date().toISOString()),
        });
      }
    }
  }
  if (resultados.length === 0) return err("sin_mensajes_parseables");
  return ok(resultados);
}