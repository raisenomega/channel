import { Result, err, ok } from "../../shared/domain/result.ts";
import { AgentId, TeamId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { AgentState, AgentType } from "../domain/agent.entity.ts";
import { TeamState } from "../domain/team.entity.ts";
import { AgentRepository, TeamRepository, RepoError } from "../domain/agents.repository.ts";
import { Role } from "../../shared/domain/types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const desdeRowAgent = (row: Record<string, unknown>): AgentState =>
  Object.freeze({
    id: row.id as AgentId,
    tenantId: row.tenant_id as TenantId,
    userId: (row.user_id as UserId) ?? null,
    agentType: row.agent_type as AgentType,
    displayName: row.display_name as string,
    email: null,
    avatarUrl: (row.avatar_url as string) ?? null,
    role: row.role as Role,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });

const desdeRowTeam = async (row: Record<string, unknown>): Promise<TeamState> => {
  const { data, error } = await supabase.from("agent_teams").select("agent_id")
    .eq("team_id", row.id as string);
  const memberIds = error ? [] : (data ?? []).map((r) => r.agent_id as AgentId);
  return Object.freeze({
    id: row.id as TeamId,
    tenantId: row.tenant_id as TenantId,
    name: row.name as string,
    description: (row.description as string) ?? null,
    isActive: row.is_active as boolean,
    memberIds: Object.freeze(memberIds),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  });
};

export class AgentRepositorySupabase implements AgentRepository {
  async guardar(agent: AgentState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("agents").upsert({
        id: agent.id,
        tenant_id: agent.tenantId,
        user_id: agent.userId,
        agent_type: agent.agentType,
        display_name: agent.displayName,
        avatar_url: agent.avatarUrl,
        role: agent.role,
        is_active: agent.isActive,
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: AgentId): Promise<Result<AgentState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowAgent(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<AgentState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("agents").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r: Record<string, unknown>) => desdeRowAgent(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorUsuario(userId: UserId): Promise<Result<AgentState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("agents").select("*").eq("user_id", userId).maybeSingle();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowAgent(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}

export class TeamRepositorySupabase implements TeamRepository {
  async guardar(team: TeamState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("teams").upsert({
        id: team.id,
        tenant_id: team.tenantId,
        name: team.name,
        description: team.description,
        is_active: team.isActive,
      }, { onConflict: "id" });
      if (error) {
        if (error.code === "23505") return err({ kind: "duplicado", campo: "name" });
        return err({ kind: "persistence_failure", cause: error.message });
      }
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: TeamId): Promise<Result<TeamState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("teams").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? await desdeRowTeam(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<TeamState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("teams").select("*").eq("tenant_id", tenantId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      const teams = data ?? [];
      const result: TeamState[] = [];
      for (const r of teams) {
        result.push(await desdeRowTeam(r));
      }
      return ok(result);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async agregarMiembro(teamId: TeamId, agentId: AgentId): Promise<Result<void, RepoError>> {
    try {
      const { data: team, error: tError } = await supabase.from("teams").select("tenant_id").eq("id", teamId).single();
      if (tError) return err({ kind: "persistence_failure", cause: tError.message });
      const { error } = await supabase.from("agent_teams").upsert({
        tenant_id: team?.tenant_id as TenantId,
        agent_id: agentId,
        team_id: teamId,
      }, { onConflict: "agent_id,team_id" });
      if (error) {
        if (error.code === "23505") return err({ kind: "duplicado", campo: "agent_id,team_id" });
        return err({ kind: "persistence_failure", cause: error.message });
      }
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}