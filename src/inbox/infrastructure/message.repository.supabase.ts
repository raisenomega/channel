import { Result, err, ok } from "../../shared/domain/result.ts";
import { MessageId, ConversationId, TenantId } from "../../shared/domain/ids.ts";
import { MessageState } from "../../inbox/domain/message.entity.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { desdeRowMessage } from "./message.mapper.ts";

export interface MessageRepository {
  guardar(msg: MessageState): Promise<Result<void, RepoError>>;
  buscar(id: MessageId): Promise<Result<MessageState | null, RepoError>>;
  buscarPorConversacion(convId: ConversationId, limit?: number): Promise<Result<MessageState[], RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class MessageRepositorySupabase implements MessageRepository {
  async guardar(msg: MessageState): Promise<Result<void, RepoError>> {
    try {
      const { error } = await supabase.from("messages").insert({
        id: msg.id, tenant_id: msg.tenantId,
        conversation_id: msg.conversationId, contact_id: msg.contactId,
        direction: msg.direction, sender_type: msg.senderType,
        channel: msg.channel, provider: msg.provider,
        content: msg.content.body, content_type: msg.content.type,
        status: msg.status,
        ai_agent_interaction_id: msg.aiMeta.interactionId,
        ai_confidence: msg.aiMeta.confidence,
        ai_mode: msg.aiMeta.mode,
      });
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscar(id: MessageId): Promise<Result<MessageState | null, RepoError>> {
    try {
      const { data, error } = await supabase.from("messages").select("*").eq("id", id).single();
      if (error?.code === "PGRST116") return ok(null);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok(data ? desdeRowMessage(data) : null);
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  async buscarPorConversacion(convId: ConversationId, limit = 50): Promise<Result<MessageState[], RepoError>> {
    try {
      const { data, error } = await supabase.from("messages").select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false }).limit(limit);
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      return ok((data ?? []).map((r) => desdeRowMessage(r)));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}