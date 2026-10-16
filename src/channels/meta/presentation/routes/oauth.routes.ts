/**
 * HUB by Raisen — Rutas HTTP para flujo Embedded Signup Meta.
 * /auth/meta/init — inicia OAuth (persiste state + signup)
 * /auth/meta/callback — recibe callback (firma MANDATORIA, state MANDATORIO, single-use)
 * C4 ≤75 lineas.
 */
// PUBLIC: flujo de signup OAuth Meta; init crea state server-side, callback exige state MANDATORIO single-use.
import type { RouteDefinition } from "../../../../server/server-types.ts";
import { tid } from "../../../../server/server-types.ts";
import { obj } from "../../../../server/server-helpers.ts";
import { InitSignupHandler } from "../../application/init-signup.handler.ts";
import { HandleCallbackHandler } from "../../application/handle-callback.handler.ts";
import { verificarFirmaWebhook } from "../../infrastructure/webhook-verifier.ts";
import { SupabaseMetaSignupFacade } from "../../infrastructure/meta-signup-facade.ts";

const repo = new SupabaseMetaSignupFacade();
const initHandler = new InitSignupHandler(repo);
const callbackHandler = new HandleCallbackHandler(repo, repo);

export function rutaInitSignup(): RouteDefinition {
  return {
    method: "POST", path: "/auth/meta/init",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      const appId = process.env["META_APP_ID"] ?? "";
      const callbackUrl = `${process.env["PUBLIC_URL"] ?? ""}/auth/meta/callback`;
      const result = await initHandler.ejecutar({ tenantId: tid(b["tenantId"] as string), callbackUrl, appId });
      return result.ok ? { ok: true, data: { url: result.value.url, state: result.value.state, signupId: result.value.signupId } } : { ok: false, error: result.error };
    },
  };
}

export function rutaCallbackMeta(): RouteDefinition {
  return {
    method: "POST", path: "/auth/meta/callback",
    handler: async (ctx) => {
      // CRIT-B: Firma MANDATORIA — usar rawBody (NO re-serializar)
      const sig = (ctx.headers?.["x-hub-signature-256"] ?? "") as string;
      if (!sig) return { ok: false, error: { kind: "firma_requerida" } };
      const rawBody = ctx.rawBody ?? "";
      const firmado = await verificarFirmaWebhook(sig, rawBody);
      if (!firmado.ok || !firmado.value) return { ok: false, error: { kind: "firma_invalida" } };

      // CRIT-C: State MANDATORIO del body (solo state, tenant_id se deriva)
      const body = obj(ctx.body);
      const state = (body as Record<string, unknown>)["state"] as string | undefined;
      if (!state) return { ok: false, error: { kind: "state_requerido" } };

      const result = await callbackHandler.ejecutar(ctx.body, state);
      return result.ok ? { ok: true, data: result.value } : { ok: false, error: result.error };
    },
  };
}
