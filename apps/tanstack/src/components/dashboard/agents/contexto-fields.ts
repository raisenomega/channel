/**
 * HUB by Raisen — Campos del Contexto en 6 partes (wizard). Alta senal para los agentes. P6 = reglas
 * de enrutamiento/escalamiento (Lista A). brandTone/responseSla son enums (CHECK DB). C4 <=75.
 */
export interface CtxField { key: string; label: string; kind: "text" | "area" | "select"; part: number; options?: readonly string[]; }
export interface CtxPart { n: number; title: string; }

export const CTX_PARTS: readonly CtxPart[] = [
  { n: 1, title: "ctx.p1" }, { n: 2, title: "ctx.p2" }, { n: 3, title: "ctx.p3" },
  { n: 4, title: "ctx.p4" }, { n: 5, title: "ctx.p5" }, { n: 6, title: "ctx.p6" },
];

export const CTX_FIELDS: readonly CtxField[] = [
  { key: "businessWhat", label: "ctx.businessWhat", kind: "area", part: 1 },
  { key: "industry", label: "ctx.industry", kind: "text", part: 1 },
  { key: "brandServices", label: "ctx.brandServices", kind: "area", part: 1 },
  { key: "targetAudience", label: "ctx.targetAudience", kind: "text", part: 2 },
  { key: "differentiator", label: "ctx.differentiator", kind: "area", part: 2 },
  { key: "competitors", label: "ctx.competitors", kind: "text", part: 2 },
  { key: "highValueCases", label: "ctx.highValueCases", kind: "area", part: 2 },
  { key: "brandTone", label: "ctx.brandTone", kind: "select", part: 3, options: ["formal", "casual", "profesional", "amigable"] },
  { key: "brandPromise", label: "ctx.brandPromise", kind: "area", part: 3 },
  { key: "neverSay", label: "ctx.neverSay", kind: "area", part: 3 },
  { key: "brandMission", label: "ctx.brandMission", kind: "area", part: 3 },
  { key: "operationHours", label: "ctx.operationHours", kind: "text", part: 4 },
  { key: "responseSla", label: "ctx.responseSla", kind: "select", part: 4, options: ["<1h", "<4h", "<24h", "best_effort"] },
  { key: "policies", label: "ctx.policies", kind: "area", part: 4 },
  { key: "mainGoal", label: "ctx.mainGoal", kind: "text", part: 5 },
  { key: "quarterGoals", label: "ctx.quarterGoals", kind: "area", part: 5 },
  { key: "customInstructions", label: "ctx.customInstructions", kind: "area", part: 5 },
  { key: "routingCriteria", label: "ctx.routingCriteria", kind: "area", part: 6 },
  { key: "escalationTriggers", label: "ctx.escalationTriggers", kind: "area", part: 6 },
  { key: "highRiskCases", label: "ctx.highRiskCases", kind: "area", part: 6 },
  { key: "neverAutomate", label: "ctx.neverAutomate", kind: "area", part: 6 },
  { key: "doubtThreshold", label: "ctx.doubtThreshold", kind: "text", part: 6 },
];
