import { assertEquals, assert } from "jsr:@std/assert";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { EvaluateRulesHandler, EvaluateRulesCommand } from "../../../src/automation/application/evaluate-rules.handler.ts";
import { AutomationRuleRepository, RepoError } from "../../../src/automation/domain/automation.repository.ts";
import { AutomationRuleState, Action, Condition } from "../../../src/automation/domain/automation.entity.ts";

const TID = crypto.randomUUID() as never;

const reglaSinCondiciones: AutomationRuleState = Object.freeze({
  id: crypto.randomUUID(),
  tenantId: TID,
  name: "Regla sin condiciones",
  trigger: "message_received",
  conditions: [],
  actions: Object.freeze([{ type: "notify", params: { channel: "email" } }]),
  isActive: true,
  priority: 1,
});

const reglaConCondicion: AutomationRuleState = Object.freeze({
  id: crypto.randomUUID(),
  tenantId: TID,
  name: "Regla con condicion",
  trigger: "message_received",
  conditions: Object.freeze([
    { field: "channel", operator: "eq", value: "whatsapp" } as Condition,
  ]),
  actions: Object.freeze([
    { type: "tag_conversation", params: { tag: "whatsapp_lead" } },
  ]),
  isActive: true,
  priority: 2,
});

Deno.test("EvaluateRulesHandler — debe ejecutar reglas sin condiciones", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([reglaSinCondiciones]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: {},
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0], reglaSinCondiciones.actions);
});

Deno.test("EvaluateRulesHandler — debe ejecutar regla cuando condicion eq se cumple", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([reglaConCondicion]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { channel: "whatsapp" },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — NO debe ejecutar regla cuando condicion eq no se cumple", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([reglaConCondicion]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { channel: "email" },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 0);
});

Deno.test("EvaluateRulesHandler — debe evaluar condicion neq", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([{
      ...reglaSinCondiciones,
      conditions: Object.freeze([{ field: "priority", operator: "neq", value: "low" } as Condition]),
    }]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { priority: "high" },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — debe evaluar condicion contains", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([{
      ...reglaSinCondiciones,
      conditions: Object.freeze([{ field: "message", operator: "contains", value: "urgente" } as Condition]),
    }]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { message: "Esto es urgente" },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — debe evaluar condicion gt", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([{
      ...reglaSinCondiciones,
      conditions: Object.freeze([{ field: "amount", operator: "gt", value: 100 } as Condition]),
    }]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { amount: 200 },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — debe evaluar condicion lt", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([{
      ...reglaSinCondiciones,
      conditions: Object.freeze([{ field: "amount", operator: "lt", value: 50 } as Condition]),
    }]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { amount: 30 },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — debe evaluar condicion in", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => ok([{
      ...reglaSinCondiciones,
      conditions: Object.freeze([{ field: "role", operator: "in", value: ["admin", "supervisor"] } as Condition]),
    }]),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: { role: "admin" },
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.length, 1);
});

Deno.test("EvaluateRulesHandler — debe fallar con error del repo cuando buscarActivas falla", async () => {
  const mockRepo: AutomationRuleRepository = {
    buscarActivas: async (_tid, _trigger) => err({ kind: "persistence_failure", cause: "timeout" }),
    guardar: async (_r) => ok(undefined),
  };

  const handler = new EvaluateRulesHandler(mockRepo);
  const cmd: EvaluateRulesCommand = {
    tenantId: TID,
    eventType: "message_received",
    context: {},
  };
  const result = await handler.ejecutar(cmd);

  assert(!result.ok);
  assertEquals(result.error.kind, "persistence_failure");
});