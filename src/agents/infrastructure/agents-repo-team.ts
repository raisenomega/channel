import { Result, err, ok } from "../../shared/domain/result.ts";
import { AgentId, TeamId, TenantId } from "../../shared/domain/ids.ts";
import { TeamState } from "../domain/team.entity.ts";
import { TeamRepository, RepoError } from "../domain/agents.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { desdeRowTeam } from "./agents-repo-mappers.ts";

export class TeamRepositorySupabase implements TeamRepository {
  async guardar(team: TeamState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("teams").upsert({
        id: team.id, tenant_id: team.tenantId, name: team.name,
        description: team.description, is_active: team.isActive,
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
      const result: TeamState[] = [];
      for (const r of data ?? []) result.push(await desdeRowTeam(r));
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