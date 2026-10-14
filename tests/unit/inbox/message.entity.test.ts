import { expect, test } from "vitest";
import { crearMensaje } from "../../../src/inbox/domain/message.entity.ts";

const CID = crypto.randomUUID() as never;
const CNID = crypto.randomUUID() as never;
const TID = crypto.randomUUID() as never;

test("crearMensaje â€” debe crear mensaje de texto", () => {
  const result = crearMensaje(CID, CNID, TID, "inbound", "contact", "whatsapp", "zernio",
    { type: "text", body: "Hola, Â¿cuÃ¡nto cuesta?" });
  expect(result.ok).toBe(true);
  expect(result.value.direction).toBe("inbound");
  expect(result.value.content.body).toBe("Hola) // Â¿cuÃ¡nto cuesta?";
  expect(result.value.status).toBe("sent");
  expect(result.value.aiMeta.editedByHuman).toBe(false);
});

test("crearMensaje â€” debe fallar con contenido vacÃ­o", () => {
  const result = crearMensaje(CID, CNID, TID, "outbound", "human_agent", "email", "resend",
    { type: "text", body: "   " });
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("contenido_vacio");
});

test("crearMensaje â€” mensaje de IA debe incluir AiMeta", () => {
  const result = crearMensaje(CID, CNID, TID, "outbound", "ai_agent", "webchat", "hub",
    { type: "text", body: "Claro, con gusto." },
    { interactionId: "int-001", confidence: 0.94, mode: "autonomous", editedByHuman: false });
  expect(result.ok).toBe(true);
  expect(result.value.senderType).toBe("ai_agent");
  expect(result.value.aiMeta.confidence).toBe(0.94);
  expect(result.value.aiMeta.mode).toBe("autonomous");
});

test("crearMensaje â€” direction debe ser inbound/outbound/internal", () => {
  const r = crearMensaje(CID, CNID, TID, "internal", "system", "webchat", "hub",
    { type: "text", body: "Sistema: conversaciÃ³n creada" });
  expect(r.ok).toBe(true);
  expect(r.value.direction).toBe("internal");
});
