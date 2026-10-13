import { assertEquals, assert } from "jsr:@std/assert";
import { registrarConsent } from "../../../src/compliance/domain/compliance.entity.ts";
import { RateLimiter } from "../../../src/compliance/domain/rate-limiter.ts";
import { generarDisclosureIA } from "../../../src/compliance/domain/rate-limiter.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

Deno.test("registrarConsent — opt_in debe crear registro valido", () => {
  const r = registrarConsent(CID, TID, "email", "opt_in", "explicit");
  assertEquals(r.channel, "email");
  assertEquals(r.action, "opt_in");
  assertEquals(r.source, "explicit");
  assert(r.expiresAt !== null);
});

Deno.test("RateLimiter — primera request debe permitir", () => {
  const rl = new RateLimiter();
  const config = { tenantId: TID, channel: "whatsapp", maxRequests: 5, windowSeconds: 60, isActive: true };
  const r = rl.verificar(TID, "whatsapp", config);
  assert(r.allowed);
  assertEquals(r.remaining, 4);
});

Deno.test("RateLimiter — debe bloquear cuando excede limite", () => {
  const rl = new RateLimiter();
  const config = { tenantId: TID, channel: "sms", maxRequests: 2, windowSeconds: 60, isActive: true };
  rl.verificar(TID, "sms", config);
  rl.verificar(TID, "sms", config);
  const r = rl.verificar(TID, "sms", config);
  assert(!r.allowed);
  assertEquals(r.remaining, 0);
});

Deno.test("generarDisclosureIA — debe retornar texto si contactAsk es true", () => {
  const config = { aiDisclosure: true, aiDisclosureText: "Soy IA, puedo ayudarte" };
  const r = generarDisclosureIA(config, null, true);
  assertEquals(r, "Soy IA, puedo ayudarte");
});

Deno.test("generarDisclosureIA — debe retornar texto si jurisdiction es CA", () => {
  const config = { aiDisclosure: true, aiDisclosureText: "AI disclosure" };
  const r = generarDisclosureIA(config, "CA", false);
  assertEquals(r, "AI disclosure");
});

Deno.test("generarDisclosureIA — debe retornar null si aiDisclosure es false", () => {
  const config = { aiDisclosure: false, aiDisclosureText: "texto" };
  assert(generarDisclosureIA(config, "CA", true) === null);
});