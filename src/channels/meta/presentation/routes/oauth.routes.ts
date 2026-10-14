/**
 * HUB by Raisen — Rutas HTTP para flujo Embedded Signup Meta.
 * /auth/meta/init — inicia OAuth (persiste state + signup)
 * /auth/meta/callback — recibe callback (verifica state + firma webhook)
 * C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../../server/server-types.ts";
import { tid } from "../../../../server/server-types.ts";
import { obj } from "../../../../server/server-helpers.ts";
import { InitSignupHandler } from "../../application/init-signup.handler.ts";
import { HandleCallbackHandler } from "../../application/handle-callback.handler.ts";
import { verificarFirmaWebhook } from "../../infrastructure/webhook-verifier.ts";
import { SupabaseEmbeddedSignupRepo } from "../supabase-embedded-signup.repo.ts";

const initHandler = new InitSignupHandler(new SupabaseEmbeddedSignupRepo());
const callbackHandler = new HandleCallbackHandler(new SupabaseEmbeddedSignupRepo(), new SupabaseEmbeddedSignupRepo());

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
      // CRIT-3: Verificar firma del webhook
      const sig = (ctx.headers?.["x-hub-signature-256"] ?? "") as string;
      if (sig) {
        const bodyStr = typeof ctx.body === "string" ? ctx.body : JSON.stringify(ctx.body);
        const firmado = await verificarFirmaWebhook(sig, bodyStr);
        if (!firmado.ok || !firmado.value) return { ok: false, error: { kind: "firma_invalida" } };
      }
      // CRIT-2: Extraer state del body y verificar
      const body = obj(ctx.body);
      const state = (body as Record<string, unknown>)["state"] as string | undefined;
      const tenantId = (body as Record<string, unknown>)["tenant_id"] as string | undefined;
      const result = await callbackHandler.ejecutar(ctx.body, state, tenantId);
      return result.ok ? { ok: true, data: result.value } : { ok: false, error: result.error };
    },
  };
}