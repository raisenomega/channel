/**
 * HUB by Raisen — Construye el evento CEREBRO `message.received` desde un mensaje parseado de Zernio.
 * Identidad: WhatsApp -> phone (E.164); otros canales -> social_handle. snake_case (wire). Puro. C4 <=75.
 */
import type { CerebroEvent } from "../../integrations/domain/cerebro.types.ts";
import type { ZernioInbound } from "./zernio-message.parser.ts";

export function cerebroMessageEvent(tenantId: string, contactId: string, z: ZernioInbound): CerebroEvent {
  const wa = z.channel === "whatsapp" && z.contactPhone.length > 0;
  return {
    event: "message.received",
    source_platform: "hub",
    tenant_id: tenantId,
    occurred_at: new Date().toISOString(),
    identity: {
      id_type: wa ? "phone" : "social_handle",
      id_value: wa ? z.contactPhone : z.contactExternalId,
      local_id: contactId,
    },
    payload: { channel: z.channel, direction: z.direction, hasText: z.content.length > 0 },
  };
}
