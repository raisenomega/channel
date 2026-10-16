import { expect, test } from "vitest";
import { CANONICAL_PERSONA_SLUGS, esPersonaCanonica } from "../../../src/cognition/domain/agent-draft.entity.ts";

test("CANONICAL_PERSONA_SLUGS tiene exactamente 7 personas", () => {
  expect(CANONICAL_PERSONA_SLUGS.length).toBe(7);
});

test("esPersonaCanonica: todos los 7 slugs pasan", () => {
  for (const s of CANONICAL_PERSONA_SLUGS) {
    expect(esPersonaCanonica(s)).toBe(true);
  }
});

test("esPersonaCanonica: slug no canonico -> false", () => {
  expect(esPersonaCanonica("pedrito")).toBe(false);
});

test("A-09 PERSONA_INVALIDA_RECHAZO: persist-draft con slug pedrito -> PERSONA_INVALIDA", () => {
  expect(esPersonaCanonica("pedrito")).toBe(false);
});

test("A-12 DRAFT_FROZEN: CANONICAL_PERSONA_SLUGS es readonly frozen", () => {
  expect(Object.isFrozen(CANONICAL_PERSONA_SLUGS)).toBe(true);
});