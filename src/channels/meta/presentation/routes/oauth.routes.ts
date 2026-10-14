/**
 * HUB by Raisen — Rutas HTTP para el flujo Embedded Signup de Meta.
 * /auth/meta/init — inicia el flujo OAuth, redirige a Meta
 * /auth/meta/callback — recibe el callback de Meta, procesa y responde
 * C4 ≤75 líneas.
 */
import type { RouteDefinition } from "../../../../server/server-types.ts";
import { tid } from "../../../../server/server-types.ts";
import { obj } from "../../../../server/server-helpers.ts";
import { InitSignupHandler } from "../../application/init-signup.handler.ts";
import { HandleCallbackHandler } from "../../application/handle-callback.handler.ts";
import type { EmbeddedSignupRepository } from "../../application/handle-callback.handler.ts";

const initHandler = new InitSignupHandler();

export function rutaInitSignup(): RouteDefinition {
  return {
    method: "POST",
    path: "/auth/meta/init",
    handler: async (ctx) => {
      const b = obj(ctx.body);
      const appId = process.env["META_APP_ID"] ?? "";
      const callbackUrl = `${process.env["PUBLIC_URL"] ?? ""}/auth/meta/callback`;
      const state = crypto.randomUUID();
      const result = await initHandler.ejecutar({
        tenantId: tid(b["tenantId"] as string),
        callbackUrl,
        appId,
        state,
      });
      return result.ok
        ? { ok: true, data: { url: result.value.url, state: result.value.state } }
        : { ok: false, error: result.error };
    },
  };
}

export function rutaCallbackMeta(repo: EmbeddedSignupRepository): RouteDefinition {
  const handler = new HandleCallbackHandler(repo);
  return {
    method: "POST",
    path: "/auth/meta/callback",
    handler: async (ctx) => {
      const result = await handler.ejecutar(ctx.body);
      return result.ok
        ? { ok: true, data: result.value }
        : { ok: false, error: result.error };
    },
  };
}