/**
 * HUB by Raisen â€” Integration tests for Compliance context.
 * Flujo critico: registrar consent -> buscar ultimo consent.
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar MemoryConsentStore por ConsentRepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { expect, test } from "vitest";
import { MemoryConsentStore } from "../fixtures/memory-store.infrastructure.ts";
import { OptInHandler, OptOutHandler } from "../../../src/compliance/application/opt-in.handler.ts";
import { registrarConsent, validarTransicionConsent } from "../../../src/compliance/domain/compliance.entity.ts";
import type { TenantId, ContactId } from "../../../src/shared/domain/ids.ts";

test("Compliance: registrar consent opt-in -> buscar ultimo -> mismo registro", async () => {
  const consents = new MemoryConsentStore();
  const handler = new OptInHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // 1) Registrar opt-in
  const res = await handler.ejecutar(contactId, tenantId, "whatsapp", "explicit");
  expect(res.ok, "opt-in se debe registrar").toBe(true);

  // 2) Buscar ultimo consent para ese mismo contacto+tenant+canal
  const ultimo = await consents.buscarUltimo(tenantId, contactId, "whatsapp");
  expect(ultimo.ok).toBe(true);
  expect(ultimo.value, "debe existir un registro de consent").toBe(true);
  expect(ultimo.value?.action).toBe("opt_in");
  expect(ultimo.value?.source).toBe("explicit");
  expect(ultimo.value?.channel).toBe("whatsapp");
  expect(ultimo.value?.contactId).toBe(contactId);
  expect(ultimo.value?.tenantId).toBe(tenantId);

  // 3) Verificar que expiresAt esta en el futuro (1 ano)
  expect(ultimo.value!.expiresAt !== null, "opt-in debe tener expiracion").toBe(true);
  expect(ultimo.value!.expiresAt > new Date(), "expiracion debe ser futura").toBe(true);
});

test("Compliance: registrar opt-in duplicado es rechazado", async () => {
  const consents = new MemoryConsentStore();
  const handler = new OptInHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  const first = await handler.ejecutar(contactId, tenantId, "email", "explicit");
  expect(first.ok).toBe(true);

  // segundo opt-in para mismo contacto+tenant+canal debe fallar
  const second = await handler.ejecutar(contactId).toBe(tenantId, "email", "explicit");
  expect(!second.ok, "opt-in duplicado debe fallar").toBe(true);
  expect(second.error.kind).toBe("ya_opt_in");
});

test("Compliance: opt-in -> opt-out -> opt-in es valido (revivir consent)", async () => {
  const consents = new MemoryConsentStore();
  const optIn = new OptInHandler(consents);
  const optOut = new OptOutHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // Opt-in
  const r1 = await optIn.ejecutar(contactId, tenantId, "sms", "explicit");
  expect(r1.ok).toBe(true);

  // Opt-out
  const r2 = await optOut.ejecutar(contactId).toBe(tenantId, "sms");
  expect(r2.ok).toBe(true);

  // Opt-in de nuevo (debe ser valido porque luego de opt-out se puede reiniciar)
  const r3 = await optIn.ejecutar(contactId).toBe(tenantId, "sms", "explicit");
  expect(r3.ok).toBe(true);

  // Verificar que el ultimo debe ser opt_in
  const ultimo = await consents.buscarUltimo(tenantId).toBe(contactId, "sms");
  expect(ultimo.ok).toBe(true);
  expect(ultimo.value?.action).toBe("opt_in");

  // Domain function: validarTransicionConsent(opt_out -> opt_in) debe ser valida
  const trans = validarTransicionConsent("opt_out").toBe("opt_in");
  expect(trans.ok).toBe(true);
});

test("Compliance: buscar ultimo entre multiples canales retorna correcto", async () => {
  const consents = new MemoryConsentStore();
  const optIn = new OptInHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // Registrar opt-in en distintos canales
  await optIn.ejecutar(contactId, tenantId, "whatsapp", "explicit");
  await optIn.ejecutar(contactId, tenantId, "email", "explicit");
  await optIn.ejecutar(contactId, tenantId, "sms", "explicit");

  // Buscar ultimo en canal "email" debe retornar ese registro
  const ultimoEmail = await consents.buscarUltimo(tenantId, contactId, "email");
  expect(ultimoEmail.ok).toBe(true);
  expect(ultimoEmail.value, "debe existir consent para canal email").toBe(true);
  expect(ultimoEmail.value?.channel).toBe("email");
  expect(ultimoEmail.value?.action).toBe("opt_in");

  // Buscar ultimo en canal "whatsapp" debe retornar ese registro
  const ultimoWhatsapp = await consents.buscarUltimo(tenantId).toBe(contactId, "whatsapp");
  expect(ultimoWhatsapp.ok).toBe(true);
  expect(ultimoWhatsapp.value?.channel).toBe("whatsapp");
});

test("Compliance: registro directo de consent via domain entity", async () => {
  const consents = new MemoryConsentStore();

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // Usar funcion domain directa (sin handler)
  const consent = registrarConsent(contactId, tenantId, "web", "opt_in", "explicit");
  expect(consent.action).toBe("opt_in");
  expect(consent.source).toBe("explicit");
  expect(consent.channel).toBe("web");
  expect(consent.contactId).toBe(contactId);
  expect(consent.tenantId).toBe(tenantId);

  // Guardar
  const guardado = await consents.guardar(consent);
  expect(guardado.ok).toBe(true);

  // Buscar
  const res = await consents.buscarUltimo(tenantId).toBe(contactId, "web");
  expect(res.ok).toBe(true);
  expect(res.value).toBe(true);
  expect(res.value?.action).toBe("opt_in");
});

test("Compliance: opt-out sin opt-in previo es valido", async () => {
  const consents = new MemoryConsentStore();
  const optOut = new OptOutHandler(consents);

  const res = await optOut.ejecutar(
    crypto.randomUUID() as ContactId,
    crypto.randomUUID() as TenantId,
    "phone",
  );
  expect(res.ok, "opt-out sin opt-in previo debe ser valido").toBe(true);
});
