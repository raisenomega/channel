import { AgentId, TeamId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { AgentState, AgentType } from "../domain/agent.entity.ts";
import { TeamState } from "../domain/team.entity.ts";
import { Role } from "../../shared/domain/types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export const desdeRowAgent = (row: Record<string, unknown>): AgentState =>
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

export const desdeRowTeam = async (row: Record<string, unknown>): Promise<TeamState> => {
  const { data, error } = await supabase.from("agent_teams").select("agent_id").eq("team_id", row.id as string);
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