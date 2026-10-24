/**
 * HUB by Raisen — Directorio de los agentes que Victor orquesta (B1). Fuente = las personas (dominio).
 * Victor necesita saber a quien derivar cada conversacion. A2: solo imports de dominio. C4 <=75.
 */
import { PERSONA_ZAHRA } from "./personas/persona.zahra.ts";
import { PERSONA_THAO } from "./personas/persona.thao.ts";
import { PERSONA_IRIS } from "./personas/persona.iris.ts";
import { PERSONA_ECO } from "./personas/persona.eco.ts";
import { PERSONA_ANGEL } from "./personas/persona.angel.ts";
import { PERSONA_KELSY } from "./personas/persona.kelsy.ts";

const ROSTER = [PERSONA_ZAHRA, PERSONA_THAO, PERSONA_IRIS, PERSONA_ECO, PERSONA_ANGEL, PERSONA_KELSY] as const;

export function buildAgentDirectory(): string {
  const lines = ROSTER.map((p) => `- ${p.nombre_display}: ${p.rol}`);
  return ["Tu equipo de agentes (deriva cada conversacion al que corresponda):", ...lines].join("\n");
}
