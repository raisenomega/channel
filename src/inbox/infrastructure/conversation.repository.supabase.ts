import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, TenantId, ContactId } from "../../shared/domain/ids.ts";
import { ConversationState } from "../../inbox/domain/conversation.entity.ts";
import { ConversationRepository, RepoError } from "../../inbox/domain/inbox.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { desdeRowConversation } from "./conversation.mapper.ts";

export class ConversationRepositorySupabase implements ConversationRepository {
  async guardar(conv: ConversationState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("conversations").upsert({
        id: conv.id, tenant_id: conv.tenantId, contact_id: conv.contactId,
        primary_channel: conv.primaryChannel, status: conv.status,
        operation_mode: conv.operationMode,
        assigned_agent_id: conv.assignedAgentId,
        total_messages: conv.totalMessages, ai_messages: conv.aiMessages,
        human_messages: conv.humanMessages,
        contact_asked_if_bot: conv.contactAskedIfBot,
        contact_asked_for_human: conv.contactAskedForHuman,
      }, { onConflict: "id" });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: ConversationId): Promise<Result<ConversationState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("conversations").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowConversation(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorContacto(tenantId: TenantId, contactId: ContactId): Promise<Result<ConversationState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("conversations").select("*")
        .eq("tenant_id", tenantId).eq("contact_id", contactId);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r) => desdeRowConversation(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarActivos(tenantId: TenantId): Promise<Result<ConversationState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("conversations").select("*")
        .eq("tenant_id", tenantId).in("status", ["open", "pending", "snoozed"])
        .order("last_message_at", { ascending: false });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r) => desdeRowConversation(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}