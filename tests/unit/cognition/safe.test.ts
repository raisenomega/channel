import { assertEquals, assert } from "jsr:@std/assert";
import { SafePreSendHandler, SafeEvalContext, SAFEEvaluator, SafeEvalResult } from "../../../src/cognition/safe/safe-evaluator.ts";
import { avanzarFaseAutonomia, activarKillSwitch, AUTONOMY_PHASES } from "../../../src/cognition/safe/safe-governance.entity.ts";

const TID = crypto.randomUUID() as never;

class MockEvaluatorApproved implements SAFEEvaluator {
  readonly provider = "mock-approve";
  async evaluar(_ctx: SafeEvalContext): Promise<Result<SafeEvalResult, string>> {
    return { ok: true, value: { approved: true, score: 0.95, reason: "all_good", metadata: {} } };
  }
}

class MockEvaluatorBlocked implements SAFEEvaluator {
  readonly provider = "mock-block";
  async evaluar(_ctx: SafeEvalContext): Promise<Result<SafeEvalResult, string>> {
    return { ok: true, value: { approved: false, score: 0.3, reason: "unsafe", metadata: {} } };
  }
}

Deno.test("SafePreSendHandler — todos los evaluadores aprueban", async () => {
  const handler = new SafePreSendHandler();
  handler.registrarEvaluador(new MockEvaluatorApproved());
  handler.registrarEvaluador(new MockEvaluatorApproved());
  const ctx: SafeEvalContext = { interactionId: null, inputMessage: "test", agentResponse: "ok", actionTaken: null, confidence: 0.9, channel: "whatsapp", contactSegment: null, tenantId: TID };
  const result = await handler.evaluar(ctx);
  assert(result.ok);
  assertEquals(result.value.decision, "approved");
});

Deno.test("SafePreSendHandler — desacuerdo > 30% bloquea", async () => {
  const handler = new SafePreSendHandler();
  handler.registrarEvaluador(new MockEvaluatorApproved());
  handler.registrarEvaluador(new MockEvaluatorBlocked());
  handler.registrarEvaluador(new MockEvaluatorBlocked());
  const ctx: SafeEvalContext = { interactionId: null, inputMessage: "test", agentResponse: "block", actionTaken: null, confidence: 0.5, channel: "email", contactSegment: null, tenantId: TID };
  const result = await handler.evaluar(ctx);
  assert(result.ok);
  assertEquals(result.value.decision, "blocked");
  assert(result.value.disagreementPct > 0.30);
});

Deno.test("avanzarFaseAutonomia — debe avanzar si thresholds se cumplen", () => {
  const prog = { tenantId: TID, currentPhase: 1, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: false, killSwitchReason: null };
  const metrics = { wasCorrect: 0.90, indistinguishability: 0.88, csat: 4.5 };
  const result = avanzarFaseAutonomia(prog, metrics);
  assert(result.ok);
  assertEquals(result.value, 2);
});

Deno.test("avanzarFaseAutonomia — no debe avanzar si was_correct es bajo", () => {
  const prog = { tenantId: TID, currentPhase: 1, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: false, killSwitchReason: null };
  const metrics = { wasCorrect: 0.70, indistinguishability: 0.90, csat: 3.0 };
  const result = avanzarFaseAutonomia(prog, metrics);
  assert(!result.ok);
  assertEquals(result.error.kind, "threshold_not_met");
});

Deno.test("avanzarFaseAutonomia — debe fallar si kill switch activo", () => {
  const prog = { tenantId: TID, currentPhase: 2, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: true, killSwitchReason: "cliente solicito" };
  const result = avanzarFaseAutonomia(prog, { wasCorrect: 0.95, indistinguishability: 0.95, csat: 5.0 });
  assert(!result.ok);
  assertEquals(result.error.kind, "kill_switch_active");
});

Deno.test("activarKillSwitch — debe crear estado con isKillSwitched=true", () => {
  const ks = activarKillSwitch("error del sistema");
  assert(ks.isKillSwitched);
  assertEquals(ks.killSwitchReason, "error del sistema");
});

Deno.test("AUTONOMY_PHASES — debe tener 5 fases (0 a 4)", () => {
  assertEquals(AUTONOMY_PHASES.length, 5);
  assertEquals(AUTONOMY_PHASES[0].phase, 0);
  assertEquals(AUTONOMY_PHASES[4].phase, 4);
});