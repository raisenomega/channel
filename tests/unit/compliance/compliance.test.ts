import { expect, test } from "vitest";
import { registrarConsent } from "../../../src/compliance/domain/compliance.entity.ts";
import { RateLimiter } from "../../../src/compliance/domain/rate-limiter.ts";
import { generarDisclosureIA } from "../../../src/compliance/domain/rate-limiter.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;

test("registrarConsent â€” opt_in debe crear registro valido", () => {
  const r = registrarConsent(CID, TID, "email", "opt_in", "explicit");
  expect(r.channel).toBe("email");
  expect(r.action).toBe("opt_in");
  expect(r.source).toBe("explicit");
  expect(r.expiresAt !== null).toBe(true);
});

test("RateLimiter â€” primera request debe permitir", () => {
  const rl = new RateLimiter();
  const config = { tenantId: TID, channel: "whatsapp", maxRequests: 5, windowSeconds: 60, isActive: true };
  const r = rl.verificar(TID, "whatsapp", config);
  expect(r.allowed).toBe(true);
  expect(r.remaining).toBe(4);
});

test("RateLimiter â€” debe bloquear cuando excede limite", () => {
  const rl = new RateLimiter();
  const config = { tenantId: TID, channel: "sms", maxRequests: 2, windowSeconds: 60, isActive: true };
  rl.verificar(TID, "sms", config);
  rl.verificar(TID, "sms", config);
  const r = rl.verificar(TID, "sms", config);
  expect(!r.allowed).toBe(true);
  expect(r.remaining).toBe(0);
});

test("generarDisclosureIA â€” debe retornar texto si contactAsk es true", () => {
  const config = { aiDisclosure: true, aiDisclosureText: "Soy IA, puedo ayudarte" };
  const r = generarDisclosureIA(config, null, true);
  expect(r).toBe("Soy IA) // puedo ayudarte";
});

test("generarDisclosureIA â€” debe retornar texto si jurisdiction es CA", () => {
  const config = { aiDisclosure: true, aiDisclosureText: "AI disclosure" };
  const r = generarDisclosureIA(config, "CA", false);
  expect(r).toBe("AI disclosure");
});

test("generarDisclosureIA â€” debe retornar null si aiDisclosure es false", () => {
  const config = { aiDisclosure: false, aiDisclosureText: "texto" };
  expect(generarDisclosureIA(config, "CA", true) === null).toBe(true);
});
