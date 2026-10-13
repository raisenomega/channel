import { Result } from "../../shared/domain/result.ts";
import { AgentId, TeamId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { AgentState } from "./agent.entity.ts";
import { TeamState } from "./team.entity.ts";

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "duplicado"; readonly campo: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export interface AgentRepository {
  guardar(agent: AgentState): Promise<Result<void, RepoError>>;
  buscar(id: AgentId): Promise<Result<AgentState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<AgentState[], RepoError>>;
  buscarPorUsuario(userId: UserId): Promise<Result<AgentState | null, RepoError>>;
}

export interface TeamRepository {
  guardar(team: TeamState): Promise<Result<void, RepoError>>;
  buscar(id: TeamId): Promise<Result<TeamState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<TeamState[], RepoError>>;
  agregarMiembro(teamId: TeamId, agentId: AgentId): Promise<Result<void, RepoError>>;
}