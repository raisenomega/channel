/**
 * HUB by Raisen — Sistema B: el cerrador parsea el JSON de la IA (encabezado + confidence) y es robusto.
 */
import { expect, test } from "vitest";
import { ClosingDraftProducer } from "../../../src/cognition/application/closing-draft.producer.ts";
import type { AIProvider } from "../../../src/cognition/domain/ai-provider.ts";
import { ok } from "../../../src/shared/domain/result.ts";

const aiCon = (resp: string): AIProvider => ({ completar: () => Promise.resolve(ok({ response: resp })) } as unknown as AIProvider);

test("SB2-01 parsea worth + encabezado + confidence", async () => {
  const resp = '{"worth":true,"message":"Hola, sigue interesado?","conclusion":"interes sin cerrar","identified":"pregunto precio 2 veces","confidence":72}';
  const r = await new ClosingDraftProducer(aiCon(resp)).producir([{ from: "cliente", text: "cuanto cuesta?" }], "Zafacones");
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.worth).toBe(true); expect(r.value.confidence).toBe(72); expect(r.value.conclusion).toContain("interes"); }
});

test("SB2-02 confidence fuera de rango -> clamp 0-100", async () => {
  const r = await new ClosingDraftProducer(aiCon('{"worth":false,"message":"","conclusion":"ya cerro","identified":"compro","confidence":150}')).producir([], "x");
  expect(r.ok && r.value.confidence).toBe(100);
});

test("SB2-03 respuesta no-JSON -> parse_failure (no crashea)", async () => {
  const r = await new ClosingDraftProducer(aiCon("lo siento no puedo")).producir([], "x");
  expect(r.ok).toBe(false);
});
