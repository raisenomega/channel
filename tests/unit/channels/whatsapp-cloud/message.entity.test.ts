import { expect, test } from "vitest";
import type { WhatsAppMessage } from "../../../../src/channels/whatsapp-cloud/domain/message.entity.ts";

test("WhatsAppMessage estructura minima outbound", () => {
  const msg: WhatsAppMessage = {
    id: "msg_1", tenantId: "t_1", wamid: "wamid.abc", phoneNumberId: "pn_1",
    direction: "outbound", fromPhone: "pn_1", toPhone: "+15551234567",
    contentType: "text", contentBody: { type: "text", body: "Hola" },
    status: "sent", sentAt: "2025-01-01T00:00:00Z", createdAt: "2025-01-01T00:00:00Z",
  };
  expect(msg.wamid).toBe("wamid.abc");
  expect(msg.direction).toBe("outbound");
  expect(msg.status).toBe("sent");
});

test("WhatsAppMessage estructura minima inbound", () => {
  const msg: WhatsAppMessage = {
    id: "msg_2", tenantId: "t_1", wamid: "wamid.xyz", phoneNumberId: "pn_2",
    direction: "inbound", fromPhone: "+521234567890", toPhone: "pn_2",
    contentType: "text", contentBody: { type: "text", body: "Recibido" },
    status: "received", createdAt: "2025-06-15T12:00:00Z",
  };
  expect(msg.direction).toBe("inbound");
  expect(msg.sentAt).toBeUndefined();
});