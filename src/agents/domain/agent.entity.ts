import { Result, err, ok } from "../../shared/domain/result.ts";
import { AgentId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { Role } from "../../shared/domain/types.ts";

export type AgentType = "human" | "ai_agent" | "bot";

export interface AgentState {
  readonly id: AgentId;
  readonly tenantId: TenantId;
  readonly userId: UserId | null;
  readonly agentType: AgentType;
  readonly displayName: string;
  readonly email: string | null;
  readonly avatarUrl: string | null;
  readonly role: Role;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type AgentCreateError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "nombre_requerido" }
  | { readonly kind: "tipo_agente_invalido" }
  | { readonly kind: "rol_invalido" };

export type AgentError =
  | { readonly kind: "agente_inactivo" }
  | { readonly kind: "transicion_invalida" };

/** Estados de disponibilidad operativa del agente. */
export type AgentStatus =
  | "en_linea"
  | "ocupado"
  | "pausa"
  | "sin_asignar"
  | "desactivado";

export const AGENT_STATUS_TRANSITIONS: Readonly<Record<AgentStatus, readonly AgentStatus[]>> = {
  en_linea: ["ocupado", "pausa", "sin_asignar", "desactivado"],
  ocupado: ["en_linea", "pausa", "sin_asignar", "desactivado"],
  pausa: ["en_linea", "ocupado", "sin_asignar", "desactivado"],
  sin_asignar: ["en_linea", "ocupado", "pausa", "desactivado"],
  desactivado: [],
};

export const crearAgente = (
  tenantId: TenantId,
  displayName: string,
  agentType: AgentType,
  role: Role,
  options: { userId?: UserId; email?: string; avatarUrl?: string } = {},
): Result<AgentState, AgentCreateError> => {
  if (!tenantId) return err({ kind: "tenant_requerido" });
  const nombre = displayName.trim();
  if (!nombre) return err({ kind: "nombre_requerido" });
  const tipos: readonly AgentType[] = ["human", "ai_agent", "bot"];
  if (!tipos.includes(agentType)) return err({ kind: "tipo_agente_invalido" });
  const roles: readonly Role[] = ["owner", "admin", "supervisor", "agent", "viewer", "superadmin"];
  if (!roles.includes(role)) return err({ kind: "rol_invalido" });

  const now = new Date();
  const state: AgentState = Object.freeze({
    id: crypto.randomUUID() as AgentId,
    tenantId,
    userId: options.userId ?? null,
    agentType,
    displayName: nombre,
    email: options.email?.trim() || null,
    avatarUrl: options.avatarUrl ?? null,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return ok(state);
};

export const transicionEstado = (
  actual: AgentStatus,
  nueva: AgentStatus,
): Result<void, AgentError> => {
  if (actual === "desactivado") return err({ kind: "agente_inactivo" });
  const permitidas = AGENT_STATUS_TRANSITIONS[actual];
  if (!permitidas || !permitidas.includes(nueva)) {
    return err({ kind: "transicion_invalida" });
  }
  return ok(undefined);
};