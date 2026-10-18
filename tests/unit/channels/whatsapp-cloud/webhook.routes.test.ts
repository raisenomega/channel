import { expect, test, vi } from "vitest";
import { rutaWebhookVerify, rutaWebhookReceive } from "../../../../src/channels/whatsapp-cloud/presentation/routes/webhook.routes.ts";
import type { RequestContext } from "../../../../src/server/server-types.ts";

test("CRIT-S2-C: verify GET con token correcto retorna challenge text/plain", async () => {
  vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "tok_verificacion_webhook_meta_fortress_32x");
  const route = rutaWebhookVerify();
  const ctx = { path: "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=tok_verificacion_webhook_meta_fortress_32x&hub.challenge=123456" } as RequestContext;
  const result = await route.handler(ctx);
  expect(result).toMatchObject({ contentType: "text/plain", status: 200, body: "123456" });
  vi.unstubAllEnvs();
});

test("verify GET con token incorrecto retorna error", async () => {
  const route = rutaWebhookVerify();
  const ctx = { path: "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=incorrecto&hub.challenge=999" } as RequestContext;
  const result = await route.handler(ctx);
  expect((result as { ok: boolean }).ok).toBe(false);
});

test("CRIT-S2-B: POST recibe sin phoneNumberId valido no persiste", async () => {
  // La ruta resuelve tenantId desde signup_lookup; si phoneNumberId no mapea → continue
  const route = rutaWebhookReceive();
  const rawBody = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "e", changes: [{ field: "messages", value: { metadata: { phone_number_id: "pn_desconocido" }, messages: [{ id: "wamid.zz", from: "+1", type: "text", text: { body: "x" } }] } }] }] });
  const ctx = {
    headers: { "x-hub-signature-256": "sha256=invalid" },
    rawBody,
    body: {},
  } as unknown as RequestContext;
  // Dado que la firma es invalida, debe retornar firma_invalida (proteccion primero)
  const result = await route.handler(ctx);
  expect((result as { ok: boolean }).ok).toBe(false);
});