import { expect, test } from "vitest";
import { construirMensajes } from "../../../src/cognition/infrastructure/anthropic-messages.ts";
import type { AICompletionParams } from "../../../src/cognition/domain/ai-provider.ts";

const base = (extra: Partial<AICompletionParams>): AICompletionParams => ({
  systemPrompt: "sys", messages: [{ role: "user", content: "¿que es esto?" }], tools: null, ...extra,
});

test("VISION-1: sin imagenes -> el contenido del user queda como string (texto plano, sin cambios)", () => {
  const msgs = construirMensajes(base({}));
  expect(msgs).toEqual([{ role: "user", content: "¿que es esto?" }]);
});

test("VISION-2: con imagen -> el ULTIMO user lleva bloque text + bloque image base64 (el agente la VE)", () => {
  const msgs = construirMensajes(base({ images: [{ mediaType: "image/jpeg", dataBase64: "QUJD" }] }));
  const content = msgs[0]?.content as Array<Record<string, unknown>>;
  expect(Array.isArray(content)).toBe(true);
  expect(content[0]).toEqual({ type: "text", text: "¿que es esto?" });
  expect(content[1]).toEqual({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "QUJD" } });
});

test("VISION-3: la imagen se adjunta SOLO al ultimo mensaje (no al historial previo)", () => {
  const params = base({ messages: [{ role: "assistant", content: "hola" }, { role: "user", content: "mira" }], images: [{ mediaType: "image/png", dataBase64: "Zz" }] });
  const msgs = construirMensajes(params);
  expect(msgs[0]).toEqual({ role: "assistant", content: "hola" }); // historial intacto (string)
  expect(Array.isArray((msgs[1]?.content as unknown))).toBe(true);   // solo el ultimo recibe la imagen
});
