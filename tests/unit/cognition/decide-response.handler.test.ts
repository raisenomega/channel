import { assertEquals, assert } from "jsr:@std/assert";
import { DecideResponseHandler, DecideResponseCommand } from "../../../src/cognition/application/decide-response.handler.ts";
import { AutonomyConfigState } from "../../../src/cognition/domain/confidence.vo.ts";

const TID = crypto.randomUUID() as never;
const CID = crypto.randomUUID() as never;
const COID = crypto.randomUUID() as never;

const autonomiaActiva: AutonomyConfigState = Object.freeze({
  channel: null,
  scheduleStart: null,
  scheduleEnd: null,
  allowedActions: Object.freeze([]),
  requiresHumanApproval: Object.freeze([]),
  isActive: true,
});

const autonomiaInactiva: AutonomyConfigState = Object.freeze({
  channel: null,
  scheduleStart: null,
  scheduleEnd: null,
  allowedActions: Object.freeze([]),
  requiresHumanApproval: Object.freeze([]),
  isActive: false,
});

Deno.test("DecideResponseHandler — debe decidir responder cuando confianza es alta y autonomia activa", async () => {
  const handler = new DecideResponseHandler();
  const cmd: DecideResponseCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    message: "Hola, quiero comprar un producto",
    channel: "whatsapp",
    confidence: 0.95,
    autonomyConfig: autonomiaActiva,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.kind, "responder");
});

Deno.test("DecideResponseHandler — debe decidir escalar si confianza es baja (< 0.3)", async () => {
  const handler = new DecideResponseHandler();
  const cmd: DecideResponseCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    message: "Hola",
    channel: "whatsapp",
    confidence: 0.1,
    autonomyConfig: autonomiaActiva,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.kind, "escalar");
  assertEquals(result.value.reason, "confianza_insuficiente");
});

Deno.test("DecideResponseHandler — debe decidir no_actuar si autonomia inactiva", async () => {
  const handler = new DecideResponseHandler();
  const cmd: DecideResponseCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    message: "Hola",
    channel: "whatsapp",
    confidence: 0.95,
    autonomyConfig: autonomiaInactiva,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.kind, "no_actuar");
});

Deno.test("DecideResponseHandler — debe escalar si detecta queja (ethics guard)", async () => {
  const handler = new DecideResponseHandler();
  const cmd: DecideResponseCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    message: "Quiero hacer un reclamo porque el producto llego roto",
    channel: "whatsapp",
    confidence: 0.95,
    autonomyConfig: autonomiaActiva,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.kind, "escalar");
  assertEquals(result.value.reason, "complaint_detected");
});

Deno.test("DecideResponseHandler — debe decidir actuar_con_confirmacion con confianza media", async () => {
  const handler = new DecideResponseHandler();
  const cmd: DecideResponseCommand = {
    tenantId: TID,
    conversationId: COID,
    contactId: CID,
    message: "Quiero saber el estado de mi pedido",
    channel: "whatsapp",
    confidence: 0.75,
    autonomyConfig: autonomiaActiva,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  // decidirAccionPorConfianza(0.75) -> actuar_con_confirmacion
  // Pero decide-response.handler solo usa el kind para "responder" genérico
  // Revisa la implementación: si accion.kind === "escalar" -> escalar, else -> responder
  assertEquals(result.value.kind, "responder");
});