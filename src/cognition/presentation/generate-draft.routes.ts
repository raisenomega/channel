/**
 * HUB by Raisen — S4a: POST /tenants/:id/conversations/:conversationId/generate-draft. Dispara el
 * productor (S3) para el ULTIMO mensaje entrante de la conversacion: lee el mensaje real server-side,
 * genera un borrador con Anthropic + contexto, lo deja en la cola supervisada. No envia. C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import { tid } from "../../server/server-types.ts";
import type { GenerateDraftHandler } from "../application/generate-draft.handler.ts";
import type { ConversationRepositorySupabase } from "../../inbox/infrastructure/conversation.repository.supabase.ts";
import type { MessageRepository } from "../../inbox/infrastructure/message.repository.supabase.ts";
import type { ConversationId } from "../../shared/domain/ids.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface GenerateDraftDeps {
  readonly generate: GenerateDraftHandler;
  readonly conversations: ConversationRepositorySupabase;
  readonly messages: MessageRepository;
}

export function rutaGenerateDraft(deps: GenerateDraftDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/conversations/:conversationId/generate-draft",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx);
      if (!auth.ok) return auth.error;
      const convId = (ctx.params["conversationId"] ?? "") as ConversationId;
      const conv = await deps.conversations.buscar(convId);
      if (!conv.ok || !conv.value) return jsonResponse(404, { ok: false, error: { kind: "conversation_not_found" } });
      if (String(conv.value.tenantId) !== auth.value.tenantId) return jsonResponse(404, { ok: false, error: { kind: "conversation_not_found" } });
      const msgs = await deps.messages.buscarPorConversacion(convId, 30);
      if (!msgs.ok) return jsonResponse(502, { ok: false, error: { kind: "messages_unavailable" } });
      const inbound = [...msgs.value].reverse().find((m) => m.direction === "inbound");
      if (!inbound) return jsonResponse(409, { ok: false, error: { kind: "sin_mensaje_entrante" } });
      const persona = String(((ctx.body ?? {}) as Record<string, unknown>)["personaSlug"] ?? "thao");
      const nm = { providerMessageId: crypto.randomUUID(), from: conv.value.participantExternalId ?? "", channel: conv.value.primaryChannel, content: inbound.content.body, attachments: [] } as NormalizedMessage;
      const r = await deps.generate.ejecutar({ tenantId: tid(auth.value.tenantId), conversationId: conv.value.id, contactId: conv.value.contactId, channel: conv.value.primaryChannel, personaSlug: persona, normalizedMessage: nm });
      if (!r.ok) return jsonResponse(502, { ok: false, error: r.error });
      return jsonResponse(200, { ok: true, draft: r.value });
    },
  };
}
