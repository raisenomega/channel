/**
 * HUB by Raisen — Ruta HTTP: GET /oauth/callback (Meta OAuth redirect via Zernio).
 */
// PUBLIC: redirect del navegador tras OAuth, no puede traer Authorization header. Defensa:
// state validado por forma (userId:platform) + code validado por forma; Zernio verifica
// code/state server-side. Sin nonce store propio todavia (deuda Hotfix F-2).
import type { RouteDefinition, RequestContext } from "./server-types.ts";

const STATE_RE = /^[A-Za-z0-9_-]{1,64}:(whatsapp|instagram|facebook)$/;
const CODE_RE = /^[A-Za-z0-9._~-]{1,512}$/;

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
      if (!STATE_RE.test(state) || !CODE_RE.test(code)) {
        return { status: 400, body: JSON.stringify({ ok: false, error: { kind: "oauth_state_invalido" } }) };
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
      const location = `/onboarding/tenant?${new URLSearchParams({ platform, connected: "true" }).toString()}`;
      return { status: 302, body: "", headers: { location } };
    },
  };
}
