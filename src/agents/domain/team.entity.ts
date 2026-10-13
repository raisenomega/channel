import { Result, err, ok } from "../../shared/domain/result.ts";
import { TeamId, TenantId, AgentId } from "../../shared/domain/ids.ts";

export interface TeamState {
  readonly id: TeamId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly memberIds: readonly AgentId[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TeamCreateError =
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "nombre_requerido" };

export type TeamError =
  | { readonly kind: "equipo_inactivo" }
  | { readonly kind: "miembro_duplicado" };

export const crearEquipo = (
  tenantId: TenantId,
  name: string,
  options: { description?: string } = {},
): Result<TeamState, TeamCreateError> => {
  if (!tenantId) return err({ kind: "tenant_requerido" });
  const nombre = name.trim();
  if (!nombre) return err({ kind: "nombre_requerido" });

  const now = new Date();
  const state: TeamState = Object.freeze({
    id: crypto.randomUUID() as TeamId,
    tenantId,
    name: nombre,
    description: options.description?.trim() || null,
    isActive: true,
    memberIds: Object.freeze([]),
    createdAt: now,
    updatedAt: now,
  });
  return ok(state);
};

export const agregarMiembro = (
  equipo: TeamState,
  agentId: AgentId,
): Result<TeamState, TeamError> => {
  if (!equipo.isActive) return err({ kind: "equipo_inactivo" });
  if (equipo.memberIds.includes(agentId)) return err({ kind: "miembro_duplicado" });
  const state: TeamState = Object.freeze({
    ...equipo,
    memberIds: Object.freeze([...equipo.memberIds, agentId]),
    updatedAt: new Date(),
  });
  return ok(state);
};