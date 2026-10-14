import { Result, err, ok } from "../../shared/domain/result.ts";
import { AgentId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { AgentState } from "../domain/agent.entity.ts";
import { AgentRepository, RepoError } from "../domain/agents.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { desdeRowAgent } from "./agents-repo-mappers.ts";

export class AgentRepositorySupabase implements AgentRepository {
  async guardar(agent: AgentState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("agents").upsert({
        id: agent.id, tenant_id: agent.tenantId, user_id: agent.userId,
        agent_type: agent.agentType, display_name: agent.displayName,
        avatar_url: agent.avatarUrl, role: agent.role, is_active: agent.isActive,
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