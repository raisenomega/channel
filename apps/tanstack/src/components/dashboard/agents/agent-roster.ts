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
