/**
 * HUB by Raisen — Roster UI de los 7 agentes (fuente unica, solo presentacion). El contenido comercial
 * vive en i18n (ag.<code>.*); aqui solo code + acento de color. No revela internals. C4 <=75.
 */
export interface AgentDef { code: string; accent: string; }

export const AGENTS: readonly AgentDef[] = [
  { code: "victor", accent: "38 92% 55%" },
  { code: "zahra", accent: "330 80% 60%" },
  { code: "thao", accent: "210 90% 60%" },
  { code: "iris", accent: "265 80% 65%" },
  { code: "eco", accent: "150 65% 48%" },
  { code: "angel", accent: "0 80% 62%" },
  { code: "kelsy", accent: "175 70% 45%" },
];

export interface AgentSec { k: string; label: string }
export const SECS: readonly AgentSec[] = [
  { k: "does", label: "ag.secDoes" },
  { k: "achieves", label: "ag.secAchieves" },
  { k: "identifies", label: "ag.secIdentifies" },
  { k: "metrics", label: "ag.secMetrics" },
  { k: "improve", label: "ag.secImprove" },
];

// Cuerpo de una seccion por agente: does/improve son comerciales; el resto = vacio honesto.
export function secBody(code: string, k: string): string {
  if (k === "does") return `ag.${code}.does`;
  if (k === "improve") return `ag.${code}.improve`;
  return "ag.noData";
}
