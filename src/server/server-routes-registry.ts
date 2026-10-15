/**
 * HUB by Raisen — Registro de todas las rutas del servidor HTTP.
 */
import type { ServerHandlers } from "./server-routes.ts";
import type { RouteDefinition } from "./server-types.ts";
import { handleWebhook, handleReceive, handleSend } from "./server-routes-messaging.ts";
import { handleQuote, handleOptIn, handleListInbox } from "./server-routes-commerce.ts";
import { rutaInitSignup, rutaCallbackMeta } from "../channels/meta/presentation/routes/oauth.routes.ts";

export function registrarRutas(h: ServerHandlers): RouteDefinition[] {
  return [
    handleWebhook(h),
    handleReceive(h),
    handleSend(h),
    handleQuote(h),
    handleOptIn(h),
    handleListInbox(h),
    rutaInitSignup(),
    rutaCallbackMeta(),
  ];
}

export function matchRoute(routes: RouteDefinition[], method: string, pathname: string): RouteDefinition | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const r of routes) {
    if (r.method !== method) continue;
    const rClean = r.path.replace(/\/+$/, "") || "/";
    if (rClean === clean || rClean === pathname) return r;
  }
  return null;
}