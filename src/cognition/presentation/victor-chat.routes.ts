/**
 * HUB by Raisen — Ruta HTTP: POST /tenants/:id/agents/victor/chat. JWT + tenant. Corre el chat real de
 * Victor (Anthropic). El provider se inyecta desde el composition root. C4 <=75.
 */
import type { RouteDefinition } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import type { AIProvider } from "../domain/ai-provider.ts";
import type { VictorChatHandler } from "../application/victor-chat.handler.ts";
import type { GenerateDraftHandler } from "../application/generate-draft.handler.ts";
import type { PersistDraftHandler } from "../application/persist-draft.handler.ts";
import { procesarDelegaciones } from "../application/victor-delegar.ts";
import { contextoMemorizado } from "../infrastructure/context-reader.ts";
import { leerPlatformContext } from "../infrastructure/platform-context.repo.ts";
import { buildPlatformFacts } from "../domain/platform-context.ts";

export interface VictorChatDeps {
  readonly chat: VictorChatHandler;
  readonly provider: AIProvider;
  readonly generate: GenerateDraftHandler; // delegacion: crea el borrador del agente real
  readonly persist: PersistDraftHandler;   // broadcast: clona el contenido a N borradores
}

export function rutaVictorChat(deps: VictorChatDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/agents/victor/chat",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx); // tenant del claim, no del path (evita mismatch de este owner)
      if (!auth.ok) return auth.error;
      const body = (ctx.body ?? {}) as { message?: string; history?: readonly { role?: string; content?: string }[] };
      const message = String(body.message ?? "").trim();
      if (!message) return jsonResponse(400, { ok: false, error: { kind: "mensaje_vacio" } });
      const history = (body.history ?? [])
        .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim() !== "")
        .slice(-12).map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content).trim() })); // hilo saneado para que Victor recuerde
      const [neg, plat] = await Promise.all([contextoMemorizado(auth.value.tenantId), leerPlatformContext(auth.value.tenantId)]);
      const facts = [neg.brandVoice, neg.catalogContext, ...buildPlatformFacts(plat)]; // negocio MEMORIZADO + plataforma fresca (canales/humanos)
      const r = await deps.chat.ejecutar(deps.provider, message, facts, history);
      if (!r.ok) return jsonResponse(502, { ok: false, error: r.error });
      const d = await procesarDelegaciones(deps.generate, deps.persist, String(auth.value.tenantId), r.value.reply);
      const reply = d.delegados.length ? `${d.reply}\n\n(Delegado a: ${d.delegados.join(", ")}. Revisa Borradores para aprobar; no se envia nada sin tu OK.)` : d.reply;
      return jsonResponse(200, { ok: true, reply, model: r.value.model });
    },
  };
}
