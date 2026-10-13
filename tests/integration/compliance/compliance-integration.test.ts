/**
 * HUB by Raisen — Integration tests for Compliance context.
 * Flujo critico: registrar consent -> buscar ultimo consent.
 *
 * NOTA: Estos tests usan almacenes en memoria y no requieren Supabase local.
 * Para probar contra DB real (P1), reemplazar MemoryConsentStore por ConsentRepositorySupabase
 * y asegurar que la extension `supabase` de Deno este configurada.
 */

import { assertEquals, assert } from "jsr:@std/assert";
import { MemoryConsentStore } from "../fixtures/memory-store.infrastructure.ts";
import { OptInHandler, OptOutHandler } from "../../../src/compliance/application/opt-in.handler.ts";
import { registrarConsent, validarTransicionConsent } from "../../../src/compliance/domain/compliance.entity.ts";
import type { TenantId, ContactId } from "../../../src/shared/domain/ids.ts";

Deno.test("Compliance: registrar consent opt-in -> buscar ultimo -> mismo registro", async () => {
  const consents = new MemoryConsentStore();
  const handler = new OptInHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // 1) Registrar opt-in
  const res = await handler.ejecutar(contactId, tenantId, "whatsapp", "explicit");
  assert(res.ok, "opt-in se debe registrar");

  // 2) Buscar ultimo consent para ese mismo contacto+tenant+canal
  const ultimo = await consents.buscarUltimo(tenantId, contactId, "whatsapp");
  assert(ultimo.ok);
  assert(ultimo.value, "debe existir un registro de consent");
  assertEquals(ultimo.value?.action, "opt_in");
  assertEquals(ultimo.value?.source, "explicit");
  assertEquals(ultimo.value?.channel, "whatsapp");
  assertEquals(ultimo.value?.contactId, contactId);
  assertEquals(ultimo.value?.tenantId, tenantId);

  // 3) Verificar que expiresAt esta en el futuro (1 ano)
  assert(ultimo.value!.expiresAt !== null, "opt-in debe tener expiracion");
  assert(ultimo.value!.expiresAt > new Date(), "expiracion debe ser futura");
});

Deno.test("Compliance: registrar opt-in duplicado es rechazado", async () => {
  const consents = new MemoryConsentStore();
  const handler = new OptInHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  const first = await handler.ejecutar(contactId, tenantId, "email", "explicit");
  assert(first.ok);

  // segundo opt-in para mismo contacto+tenant+canal debe fallar
  const second = await handler.ejecutar(contactId, tenantId, "email", "explicit");
  assert(!second.ok, "opt-in duplicado debe fallar");
  assertEquals(second.error.kind, "ya_opt_in");
});

Deno.test("Compliance: opt-in -> opt-out -> opt-in es valido (revivir consent)", async () => {
  const consents = new MemoryConsentStore();
  const optIn = new OptInHandler(consents);
  const optOut = new OptOutHandler(consents);

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // Opt-in
  const r1 = await optIn.ejecutar(contactId, tenantId, "sms", "explicit");
  assert(r1.ok);

  // Opt-out
  const r2 = await optOut.ejecutar(contactId, tenantId, "sms");
  assert(r2.ok);

  // Opt-in de nuevo (debe ser valido porque luego de opt-out se puede reiniciar)
  const r3 = await optIn.ejecutar(contactId, tenantId, "sms", "explicit");
  assert(r3.ok);

  // Verificar que el ultimo debe ser opt_in
  const ultimo = await consents.buscarUltimo(tenantId, contactId, "sms");
  assert(ultimo.ok);
  assertEquals(ultimo.value?.action, "opt_in");

  // Domain function: validarTransicionConsent(opt_out -> opt_in) debe ser valida
  const trans = validarTransicionConsent("opt_out", "opt_in");
  assert(trans.ok);
});

Deno.test("Compliance: buscar ultimo entre multiples canales retorna correcto", async () => {
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
  assert(ultimoEmail.ok);
  assert(ultimoEmail.value, "debe existir consent para canal email");
  assertEquals(ultimoEmail.value?.channel, "email");
  assertEquals(ultimoEmail.value?.action, "opt_in");

  // Buscar ultimo en canal "whatsapp" debe retornar ese registro
  const ultimoWhatsapp = await consents.buscarUltimo(tenantId, contactId, "whatsapp");
  assert(ultimoWhatsapp.ok);
  assertEquals(ultimoWhatsapp.value?.channel, "whatsapp");
});

Deno.test("Compliance: registro directo de consent via domain entity", async () => {
  const consents = new MemoryConsentStore();

  const tenantId = crypto.randomUUID() as TenantId;
  const contactId = crypto.randomUUID() as ContactId;

  // Usar funcion domain directa (sin handler)
  const consent = registrarConsent(contactId, tenantId, "web", "opt_in", "explicit");
  assertEquals(consent.action, "opt_in");
  assertEquals(consent.source, "explicit");
  assertEquals(consent.channel, "web");
  assertEquals(consent.contactId, contactId);
  assertEquals(consent.tenantId, tenantId);

  // Guardar
  const guardado = await consents.guardar(consent);
  assert(guardado.ok);

  // Buscar
  const res = await consents.buscarUltimo(tenantId, contactId, "web");
  assert(res.ok);
  assert(res.value);
  assertEquals(res.value?.action, "opt_in");
});

Deno.test("Compliance: opt-out sin opt-in previo es valido", async () => {
  const consents = new MemoryConsentStore();
  const optOut = new OptOutHandler(consents);

  const res = await optOut.ejecutar(
    crypto.randomUUID() as ContactId,
    crypto.randomUUID() as TenantId,
    "phone",
  );
  assert(res.ok, "opt-out sin opt-in previo debe ser valido");
});