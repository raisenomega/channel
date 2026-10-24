/**
 * HUB by Raisen — Campos del Contexto en 5 partes (wizard). Alta senal para los agentes.
 * brandTone y responseSla son enums (CHECK en DB). hasProducts es derivado (no editable aqui).
 */
export interface CtxField { key: string; label: string; kind: "text" | "area" | "select"; part: number; options?: readonly string[]; }
export interface CtxPart { n: number; title: string; }

export const CTX_PARTS: readonly CtxPart[] = [
  { n: 1, title: "ctx.p1" }, { n: 2, title: "ctx.p2" }, { n: 3, title: "ctx.p3" },
  { n: 4, title: "ctx.p4" }, { n: 5, title: "ctx.p5" },
];

export const CTX_FIELDS: readonly CtxField[] = [
  { key: "businessWhat", label: "ctx.businessWhat", kind: "area", part: 1 },
  { key: "industry", label: "ctx.industry", kind: "text", part: 1 },
  { key: "brandServices", label: "ctx.brandServices", kind: "area", part: 1 },
  { key: "targetAudience", label: "ctx.targetAudience", kind: "text", part: 2 },
  { key: "differentiator", label: "ctx.differentiator", kind: "area", part: 2 },
  { key: "competitors", label: "ctx.competitors", kind: "text", part: 2 },
  { key: "brandTone", label: "ctx.brandTone", kind: "select", part: 3, options: ["formal", "casual", "profesional", "amigable"] },
  { key: "brandMission", label: "ctx.brandMission", kind: "area", part: 3 },
  { key: "operationHours", label: "ctx.operationHours", kind: "text", part: 4 },
  { key: "responseSla", label: "ctx.responseSla", kind: "select", part: 4, options: ["<1h", "<4h", "<24h", "best_effort"] },
  { key: "policies", label: "ctx.policies", kind: "area", part: 4 },
  { key: "mainGoal", label: "ctx.mainGoal", kind: "text", part: 5 },
  { key: "customInstructions", label: "ctx.customInstructions", kind: "area", part: 5 },
];
