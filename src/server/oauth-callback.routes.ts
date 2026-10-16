/**
 * HUB by Raisen — GET /oauth/callback (Meta OAuth redirect via Zernio). Hotfix H-1.
 * Persiste channel_connections tras callback exitoso. Regex estricto en state + code.
 * Sin JWT (es redirect del navegador, publica). Defensa: state validado por forma.
 * C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "./server-types.ts";
import { ejecutarOAuthLink } from "../channels/infrastructure/oauth-callback.linker.ts";
import { ChannelConnectionsRepo } from "../channels/infrastructure/channel-connections.repository.ts";
import type { SocialPlatform } from "../channels/domain/social-account.entity.ts";

const STATE_RE = /^[A-Za-z0-9_-]{1,64}:(whatsapp|instagram|facebook)$/;
const CODE_RE = /^[A-Za-z0-9._~-]{1,512}$/;
function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

const repo = new ChannelConnectionsRepo();

export function rutaOAuthCallback(): RouteDefinition {
  return {
    method: "GET", path: "/oauth/callback",
    handler: async (ctx: RequestContext) => {
      const queryStr = ctx.path.includes("?") ? ctx.path.split("?")[1] ?? "" : "";
      const params = new URLSearchParams(queryStr);
      const code = params.get("code") ?? "";
      const state = params.get("state") ?? "";
      if (!code || !state) return { status: 400, body: JSON.stringify({ ok: false, error: { kind: "oauth_callback_missing_code" } }) };
      if (!STATE_RE.test(state) || !CODE_RE.test(code)) return { status: 400, body: JSON.stringify({ ok: false, error: { kind: "oauth_state_invalido" } }) };
      const platform = state.split(":")[1] ?? "";
      const linker = await ejecutarOAuthLink(code, state, getEnv("ZERNIO_API_KEY") ?? "", async (tid, plat, aid) => {
        const conn = { id: crypto.randomUUID(), tenantId: tid, platform: plat as SocialPlatform, zernioAccountId: aid, handle: null, followersCount: null, status: "connected" as const, isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return repo.guardar(conn);
      });
      if (!linker.ok) {
        const kind = linker.error.kind === "persistence_error" ? "persistence_error" : "zernio_callback_failed";
        return { status: linker.error.kind === "account_id_hostil" ? 502 : 502, body: JSON.stringify({ ok: false, error: { kind } }) };
      }
      const location = `/onboarding/tenant?${new URLSearchParams({ platform, connected: "true" }).toString()}`;
      return { status: 302, body: "", headers: { location } };
    },
  };
}