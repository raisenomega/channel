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
export type AgentStatus = "en_linea" | "ocupado" | "pausa" | "sin_asignar" | "desactivado";

export const AGENT_STATUS_TRANSITIONS: Readonly<Record<AgentStatus, readonly AgentStatus[]>> = {
  en_linea: ["ocupado", "pausa", "sin_asignar", "desactivado"],
  ocupado: ["en_linea", "pausa", "sin_asignar", "desactivado"],
  pausa: ["en_linea", "ocupado", "sin_asignar", "desactivado"],
  sin_asignar: ["en_linea", "ocupado", "pausa", "desactivado"],
  desactivado: [],
};