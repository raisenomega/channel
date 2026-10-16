/**
 * HUB by Raisen — Ruta HTTP: GET /oauth/callback (Meta OAuth redirect).
 */
import type { RouteDefinition, RequestContext } from "./server-types.ts";

export function rutaOAuthCallback(): RouteDefinition {
  return {
    method: "GET", path: "/oauth/callback",
    handler: async (ctx: RequestContext) => {
      const queryStr = ctx.path.includes("?") ? ctx.path.split("?")[1] ?? "" : "";
      const params = new URLSearchParams(queryStr);
      const code = params.get("code") ?? "";
      const state = params.get("state") ?? "";
      if (!code || !state) {
        return { status: 400, body: JSON.stringify({ ok: false, error: { kind: "oauth_callback_missing_code" } }) };
      }
      const platform = state.split(":")[1] ?? "";
      const callZernio = await fetch("https://api.zernio.io/v1/oauth/callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      if (!callZernio.ok) {
        return { status: 502, body: JSON.stringify({ ok: false, error: { kind: "zernio_callback_failed" } }) };
      }
      const location = `/onboarding/tenant?${new URLSearchParams({
        platform, connected: "true",
      }).toString()}`;
      return { status: 302, body: "", headers: { location } };
    },
  };
}