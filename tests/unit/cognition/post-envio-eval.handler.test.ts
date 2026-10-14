import { expect, test } from "vitest";
import { PostEnvioEvalHandler, PostEnvioEvalCommand } from "../../../src/cognition/application/post-envio-eval.handler.ts";
import type { AgentKnowledgeState } from "../../../src/cognition/domain/agent.service.ts";

const TID = crypto.randomUUID() as never;

const baseKnowledge: AgentKnowledgeState = Object.freeze({
  id: crypto.randomUUID(),
  tenantId: TID,
  category: "rule",
  knowledge: "Los envios a Mayaguez tardan 2 dias habiles",
  confidence: 0.5,
  timesApplied: 0,
  timesConfirmed: 5,
  timesCorrected: 0,
  status: "active",
});

test("PostEnvioEvalHandler â€” debe incrementar confianza cuando wasCorrect=true", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value.newConfidence).toBe(0.55);
  expect(result.value.timesApplied).toBe(1);
});

test("PostEnvioEvalHandler â€” debe decrementar confianza cuando wasCorrect=false", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: false,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value.newConfidence).toBe(0.35);
  expect(result.value.timesApplied).toBe(1);
});

test("PostEnvioEvalHandler â€” shouldArchive=true si confianza cae por debajo de 0.2", async () => {
  const handler = new PostEnvioEvalHandler();
  const lowKnowledge: AgentKnowledgeState = Object.freeze({
    ...baseKnowledge,
    confidence: 0.15,
  });
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: lowKnowledge,
    wasCorrect: false,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  // 0.15 - 0.15 = 0.0 (Math.max con 0)
  expect(result.value.newConfidence).toBe(0);
  expect(result.value.shouldArchive).toBe(true);
});

test("PostEnvioEvalHandler â€” shouldPromote=true si confianza > 0.9 y timesConfirmed >= 5", async () => {
  const handler = new PostEnvioEvalHandler();
  const highKnowledge: AgentKnowledgeState = Object.freeze({
    ...baseKnowledge,
    confidence: 0.88,
    timesConfirmed: 5,
  });
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: highKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  // 0.88 + 0.05 = 0.93 > 0.9, timesConfirmed = 6 >= 5
  expect(result.value.newConfidence).toBe(0.93);
  expect(result.value.shouldPromote).toBe(true);
});

test("PostEnvioEvalHandler â€” shouldPromote=false si timesConfirmed < 5", async () => {
  const handler = new PostEnvioEvalHandler();
  const knowledge: AgentKnowledgeState = Object.freeze({
    ...baseKnowledge,
    confidence: 0.95,
    timesConfirmed: 2,
  });
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: knowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value.shouldPromote).toBe(false);
});

test("PostEnvioEvalHandler â€” debe topar confianza en 1.0 maximo", async () => {
  const handler = new PostEnvioEvalHandler();
  const maxKnowledge: AgentKnowledgeState = Object.freeze({
    ...baseKnowledge,
    confidence: 0.99,
  });
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: maxKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(result.value.newConfidence).toBe(1);
});

test("PostEnvioEvalHandler â€” debe retornar objeto congelado (inmutable)", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  expect(result.ok).toBe(true);
  expect(Object.isFrozen(result.value)).toBe(true);
});
