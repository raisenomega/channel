import { assertEquals, assert } from "jsr:@std/assert";
import { crearRegla, AutomationTrigger } from "../../../src/automation/domain/automation.entity.ts";

const TID = crypto.randomUUID() as never;

Deno.test("crearRegla — debe crear regla con trigger y acciones", () => {
  const result = crearRegla(TID, "Bienvenida fuera de horario", "message_received", [
    { type: "send_auto_reply", params: { template: "bienvenida" } },
  ]);
  assert(result.ok);
  assertEquals(result.value.name, "Bienvenida fuera de horario");
  assertEquals(result.value.trigger, "message_received");
  assertEquals(result.value.isActive, true);
  assertEquals(result.value.actions.length, 1);
});

Deno.test("crearRegla — debe fallar con nombre vacio", () => {
  const result = crearRegla(TID, "", "message_received", [{ type: "notify", params: {} }]);
  assert(!result.ok);
  assertEquals(result.error.kind, "nombre_vacio");
});

Deno.test("crearRegla — debe fallar con trigger invalido", () => {
  const result = crearRegla(TID, "Test", "invalid_trigger" as AutomationTrigger, [{ type: "tag", params: { tag: "test" } }]);
  assert(!result.ok);
  assertEquals(result.error.kind, "trigger_invalido");
});

Deno.test("crearRegla — debe fallar sin acciones", () => {
  const result = crearRegla(TID, "Test", "sla_breach", []);
  assert(!result.ok);
  assertEquals(result.error.kind, "acciones_vacias");
});

Deno.test("crearRegla — todos los triggers validos", () => {
  const triggers: AutomationTrigger[] = [
    "message_received", "conversation_created", "conversation_assigned",
    "status_changed", "sla_breach", "keyword", "segment_entered",
    "quote_accepted", "order_confirmed", "payment_received",
  ];
  for (const t of triggers) {
    const result = crearRegla(TID, `Regla ${t}`, t, [{ type: "log", params: {} }]);
    assert(result.ok, `Trigger ${t} deberia ser valido`);
  }
});