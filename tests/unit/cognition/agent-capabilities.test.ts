/**
 * HUB by Raisen — B6: el bloque de capacidades es HONESTO (lee el registry real + dice que no ejecuta).
 */
import { expect, test } from "vitest";
import { buildCapabilitiesBlock } from "../../../src/cognition/domain/agent-capabilities.ts";

test("CAP-01 lista acciones reales del registry y es honesto (no ejecuta)", () => {
  const b = buildCapabilitiesBlock();
  expect(b).toContain("create_quote");          // accion real del TOOL_REGISTRY
  expect(b).toContain("escalar_a_humano");
  expect(b.toLowerCase()).toContain("no las ejecutas");
});
