import { expect, test } from "vitest";
import { crearRegla, AutomationTrigger } from "../../../src/automation/domain/automation.entity.ts";

const TID = crypto.randomUUID() as never;

test("crearRegla â€” debe crear regla con trigger y acciones", () => {
  const result = crearRegla(TID, "Bienvenida fuera de horario", "message_received", [
    { type: "send_auto_reply", params: { template: "bienvenida" } },
  ]);
  expect(result.ok).toBe(true);
  expect(result.value.name).toBe("Bienvenida fuera de horario");
  expect(result.value.trigger).toBe("message_received");
  expect(result.value.isActive).toBe(true);
  expect(result.value.actions.length).toBe(1);
});

test("crearRegla â€” debe fallar con nombre vacio", () => {
  const result = crearRegla(TID, "", "message_received", [{ type: "notify", params: {} }]);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("nombre_vacio");
});

test("crearRegla â€” debe fallar con trigger invalido", () => {
  const result = crearRegla(TID, "Test", "invalid_trigger" as AutomationTrigger, [{ type: "tag", params: { tag: "test" } }]);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("trigger_invalido");
});

test("crearRegla â€” debe fallar sin acciones", () => {
  const result = crearRegla(TID, "Test", "sla_breach", []);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("acciones_vacias");
});

test("crearRegla â€” todos los triggers validos", () => {
  const triggers: AutomationTrigger[] = [
    "message_received", "conversation_created", "conversation_assigned",
    "status_changed", "sla_breach", "keyword", "segment_entered",
    "quote_accepted", "order_confirmed", "payment_received",
  ];
  for (const t of triggers) {
    const result = crearRegla(TID, `Regla ${t}`, t, [{ type: "log", params: {} }]);
  expect(result.ok, `Trigger ${t} deberia ser valido`).toBe(true);
  }
});
