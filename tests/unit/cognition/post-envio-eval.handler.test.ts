import { assertEquals, assert } from "jsr:@std/assert";
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

Deno.test("PostEnvioEvalHandler — debe incrementar confianza cuando wasCorrect=true", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.newConfidence, 0.55);
  assertEquals(result.value.timesApplied, 1);
});

Deno.test("PostEnvioEvalHandler — debe decrementar confianza cuando wasCorrect=false", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: false,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assertEquals(result.value.newConfidence, 0.35);
  assertEquals(result.value.timesApplied, 1);
});

Deno.test("PostEnvioEvalHandler — shouldArchive=true si confianza cae por debajo de 0.2", async () => {
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

  assert(result.ok);
  // 0.15 - 0.15 = 0.0 (Math.max con 0)
  assertEquals(result.value.newConfidence, 0);
  assertEquals(result.value.shouldArchive, true);
});

Deno.test("PostEnvioEvalHandler — shouldPromote=true si confianza > 0.9 y timesConfirmed >= 5", async () => {
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

  assert(result.ok);
  // 0.88 + 0.05 = 0.93 > 0.9, timesConfirmed = 6 >= 5
  assertEquals(result.value.newConfidence, 0.93);
  assertEquals(result.value.shouldPromote, true);
});

Deno.test("PostEnvioEvalHandler — shouldPromote=false si timesConfirmed < 5", async () => {
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

  assert(result.ok);
  assertEquals(result.value.shouldPromote, false);
});

Deno.test("PostEnvioEvalHandler — debe topar confianza en 1.0 maximo", async () => {
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

  assert(result.ok);
  assertEquals(result.value.newConfidence, 1);
});

Deno.test("PostEnvioEvalHandler — debe retornar objeto congelado (inmutable)", async () => {
  const handler = new PostEnvioEvalHandler();
  const cmd: PostEnvioEvalCommand = {
    knowledgeState: baseKnowledge,
    wasCorrect: true,
  };
  const result = await handler.ejecutar(cmd);

  assert(result.ok);
  assert(Object.isFrozen(result.value));
});