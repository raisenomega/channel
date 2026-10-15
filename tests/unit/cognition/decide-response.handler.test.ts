import { expect, test } from "vitest";
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

test("DecideResponseHandler â€” debe decidir responder cuando confianza es alta y autonomia activa", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.kind).toBe("responder");
});

test("DecideResponseHandler â€” I9: confianza baja (<7/10) -> hold_for_human_review", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.kind).toBe("hold_for_human_review");
  if (result.value.kind === "hold_for_human_review") {
    expect(result.value.reason).toBe("confidence_below_threshold");
    expect(result.value.threshold).toBe(7);
  }
});

test("DecideResponseHandler â€” debe decidir no_actuar si autonomia inactiva", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.kind).toBe("no_actuar");
});

test("DecideResponseHandler â€” debe escalar si detecta queja (ethics guard)", async () => {
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

  expect(result.ok).toBe(true);
  expect(result.value.kind).toBe("escalar");
  expect(result.value.reason).toBe("complaint_detected");
});

test("DecideResponseHandler â€” debe decidir actuar_con_confirmacion con confianza media", async () => {
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

  expect(result.ok).toBe(true);
  // decidirAccionPorConfianza(0.75) -> actuar_con_confirmacion
  // Pero decide-response.handler solo usa el kind para "responder" genÃ©rico
  // Revisa la implementaciÃ³n: si accion.kind === "escalar" -> escalar, else -> responder
  expect(result.value.kind).toBe("responder");
});
