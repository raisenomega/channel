/**
 * HUB by Raisen — Tool Registry (BC Cognition).
 * Agrega los registros parciales (comms, commerce, ops) en un unico
 * TOOL_REGISTRY inmutable. Separacion por archivos para cumplir C4.
 *
 * Total: 16 tools. Sin any.
 */
import type { ToolDef } from "./tool.types.ts";
import { COMMS_TOOLS } from "./tool.registry.comms.ts";
import { COMMERCE_TOOLS } from "./tool.registry.commerce.ts";
import { OPS_TOOLS } from "./tool.registry.ops.ts";

export type { ContentType, ToolDef } from "./tool.types.ts";

const LEYENDAS: Readonly<Record<string, ToolDef>> = Object.freeze({
  escalate_to_human: Object.freeze({
    name: "escalate_to_human", description: "Escalar a un agente humano (alias)",
    parameters: Object.freeze({ conversationId: "string", reason: "string", context: "object" }),
    minConfidence: 0.0, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]), escalationTriggers: Object.freeze([]),
  }),
});

export const TOOL_REGISTRY: Readonly<Record<string, ToolDef>> = Object.freeze({
  ...COMMS_TOOLS,
  ...COMMERCE_TOOLS,
  ...OPS_TOOLS,
  ...LEYENDAS,
});