import { expect, test } from "vitest";
import { AI_DISCLOSURE_TEMPLATE, aplicarDisclosure, debeIncluirDisclosure } from "../../../src/cognition/application/ai-disclosure.ts";

test("A-02 DISCLOSURE_PRIMER_MENSAJE: primer mensaje con tenant name reemplazado", () => {
  const r = aplicarDisclosure({ tenantName: "Zafacones", isFirstMessageOfConversation: true });
  expect(r).toContain("Zafacones");
  expect(r).not.toContain("[TENANT_NAME]");
});

test("A-03 DISCLOSURE_NO_REPETIDO: no primer mensaje -> string vacio", () => {
  expect(aplicarDisclosure({ tenantName: "X", isFirstMessageOfConversation: false })).toBe("");
});

test("A-04 DISCLOSURE_WORDING_LITERAL: template exacto del doc §5.4 no modificado", () => {
  expect(AI_DISCLOSURE_TEMPLATE).toBe(
    "👋 Soy tu asistente de [TENANT_NAME]. HUB es una plataforma híbrida humano-agente — un humano revisa decisiones importantes."
  );
});

test("debeIncluirDisclosure solo en primer mensaje", () => {
  expect(debeIncluirDisclosure({ tenantName: "X", isFirstMessageOfConversation: true })).toBe(true);
  expect(debeIncluirDisclosure({ tenantName: "X", isFirstMessageOfConversation: false })).toBe(false);
});