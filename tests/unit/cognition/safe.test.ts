import { expect, test } from "vitest";
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

test("SafePreSendHandler â€” todos los evaluadores aprueban", async () => {
  const handler = new SafePreSendHandler();
  handler.registrarEvaluador(new MockEvaluatorApproved());
  handler.registrarEvaluador(new MockEvaluatorApproved());
  const ctx: SafeEvalContext = { interactionId: null, inputMessage: "test", agentResponse: "ok", actionTaken: null, confidence: 0.9, channel: "whatsapp", contactSegment: null, tenantId: TID };
  const result = await handler.evaluar(ctx);
  expect(result.ok).toBe(true);
  expect(result.value.decision).toBe("approved");
});

test("SafePreSendHandler â€” desacuerdo > 30% bloquea", async () => {
  const handler = new SafePreSendHandler();
  handler.registrarEvaluador(new MockEvaluatorApproved());
  handler.registrarEvaluador(new MockEvaluatorBlocked());
  handler.registrarEvaluador(new MockEvaluatorBlocked());
  const ctx: SafeEvalContext = { interactionId: null, inputMessage: "test", agentResponse: "block", actionTaken: null, confidence: 0.5, channel: "email", contactSegment: null, tenantId: TID };
  const result = await handler.evaluar(ctx);
  expect(result.ok).toBe(true);
  expect(result.value.decision).toBe("blocked");
  expect(result.value.disagreementPct > 0.30).toBe(true);
});

test("avanzarFaseAutonomia â€” debe avanzar si thresholds se cumplen", () => {
  const prog = { tenantId: TID, currentPhase: 1, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: false, killSwitchReason: null };
  const metrics = { wasCorrect: 0.90, indistinguishability: 0.88, csat: 4.5 };
  const result = avanzarFaseAutonomia(prog, metrics);
  expect(result.ok).toBe(true);
  expect(result.value).toBe(2);
});

test("avanzarFaseAutonomia â€” no debe avanzar si was_correct es bajo", () => {
  const prog = { tenantId: TID, currentPhase: 1, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: false, killSwitchReason: null };
  const metrics = { wasCorrect: 0.70, indistinguishability: 0.90, csat: 3.0 };
  const result = avanzarFaseAutonomia(prog, metrics);
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("threshold_not_met");
});

test("avanzarFaseAutonomia â€” debe fallar si kill switch activo", () => {
  const prog = { tenantId: TID, currentPhase: 2, wasCorrectThreshold: 0.85, indistinguishabilityThreshold: 0.80, isKillSwitched: true, killSwitchReason: "cliente solicito" };
  const result = avanzarFaseAutonomia(prog, { wasCorrect: 0.95, indistinguishability: 0.95, csat: 5.0 });
  expect(!result.ok).toBe(true);
  expect(result.error.kind).toBe("kill_switch_active");
});

test("activarKillSwitch â€” debe crear estado con isKillSwitched=true", () => {
  const ks = activarKillSwitch("error del sistema");
  expect(ks.isKillSwitched).toBe(true);
  expect(ks.killSwitchReason).toBe("error del sistema");
});

test("AUTONOMY_PHASES â€” debe tener 5 fases (0 a 4)", () => {
  expect(AUTONOMY_PHASES.length).toBe(5);
  expect(AUTONOMY_PHASES[0].phase).toBe(0);
  expect(AUTONOMY_PHASES[4].phase).toBe(4);
});
