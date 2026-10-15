import { expect, test } from "vitest";
import { parsearPayloadMeta } from "../../../../src/channels/whatsapp-cloud/infrastructure/webhook-payload.parser.ts";

test("payload valido de Meta retorna mensajes", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "entry_1",
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { phone_number_id: "pn_123", display_phone_number: "+15551234567" },
          messages: [{ id: "wamid.001", from: "+521234567890", type: "text", text: { body: "Hola" }, timestamp: "2025-01-01T00:00:00Z" }],
        },
      }],
    }],
  };
  const result = parsearPayloadMeta(payload as Record<string, unknown>);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.length).toBe(1);
    expect(result.value[0].wamid).toBe("wamid.001");
    expect(result.value[0].fromPhone).toBe("+521234567890");
    expect(result.value[0].phoneNumberId).toBe("pn_123");
  }
});

test("payload con object incorrecto retorna error", () => {
  const result = parsearPayloadMeta({ object: "not_whatsapp", entry: [] } as Record<string, unknown>);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe("object_no_whatsapp");
});

test("payload sin messages retorna error", () => {
  const result = parsearPayloadMeta({ object: "whatsapp_business_account", entry: [{ id: "e1", changes: [] }] } as Record<string, unknown>);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe("sin_mensajes_parseables");
});