/**
 * HUB by Raisen — Ruta HTTP: POST /tenants/:id/agents/victor/chat. JWT + tenant. Corre el chat real de
 * Victor (Anthropic). El provider se inyecta desde el composition root. C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import type { VictorChatHandler } from "../application/victor-chat.handler.ts";
import { leerContexto } from "../infrastructure/context.repo.ts";
import { buildFacts } from "../domain/business-context.ts";

export interface VictorChatDeps {
  readonly chat: VictorChatHandler;
  readonly provider: AIProvider;
}

export function rutaVictorChat(deps: VictorChatDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/agents/victor/chat",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx); // tenant del claim, no del path (evita mismatch de este owner)
      if (!auth.ok) return auth.error;
      const body = (ctx.body ?? {}) as { message?: string };
      const message = String(body.message ?? "").trim();
      if (!message) return jsonResponse(400, { ok: false, error: { kind: "mensaje_vacio" } });
      const facts = buildFacts(await leerContexto(auth.value.tenantId)); // contexto real del negocio
      const r = await deps.chat.ejecutar(deps.provider, message, facts);
      if (!r.ok) return jsonResponse(502, { ok: false, error: r.error });
      return jsonResponse(200, { ok: true, reply: r.value.reply, model: r.value.model });
    },
  };
}
