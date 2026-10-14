/**
 * HUB by Raisen — Entidades del BC de agentes (barrel).
 * Tipos y fábricas en submódulos (C4 ≤75).
 */
export {
  AGENT_STATUS_TRANSITIONS,
  type AgentType,
  type AgentState,
  type AgentCreateError,
  type AgentError,
  type AgentStatus,
} from "./agent-types.ts";
export { crearAgente, transicionEstado } from "./agent-factories.ts";