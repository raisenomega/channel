/**
 * HUB by Raisen — Construye el evento CEREBRO `message.received` desde un mensaje parseado de Zernio.
 * Identidad: WhatsApp -> phone (E.164); otros canales -> social_handle. Puro. C4 <=75.
 */
import type { CerebroEvent } from "../../integrations/domain/cerebro.types.ts";
import type { ZernioInbound } from "./zernio-message.parser.ts";

export function cerebroMessageEvent(tenantId: string, contactId: string, z: ZernioInbound): CerebroEvent {
  const wa = z.channel === "whatsapp" && z.contactPhone.length > 0;
  return {
    event: "message.received",
    sourcePlatform: "hub",
    tenantId,
    occurredAt: new Date().toISOString(),
    identity: {
      idType: wa ? "phone" : "social_handle",
      idValue: wa ? z.contactPhone : z.contactExternalId,
      localId: contactId,
    },
    payload: { channel: z.channel, direction: z.direction, text: z.content, contact_name: z.contactName }, // texto REAL -> cerebro lo embebe como chunk
  };
}
