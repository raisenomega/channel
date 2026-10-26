/**
 * HUB by Raisen — Rutas PUBLICAS (sin JWT) de la cotizacion por token: ver + aceptar/rechazar. El cliente
 * abre el link que le llego por su canal. CSP bloqueado (sin JS), escape total en el renderer. C4 <=75.
 */
import type { RouteDefinition, HttpResponse, RequestContext } from "../../server/server-types.ts";
import { RateLimiter } from "../../pay/infrastructure/rate-limit.ts";
import { leerCotizacionPorToken, decidirCotizacion } from "../infrastructure/public-quote.query.ts";
import { renderQuotePage, pageSimple } from "./public-quote.renderer.ts";
// PUBLIC: cotizacion por token para el cliente final (ver/aceptar/rechazar); sin JWT por diseno, el token uuid es la credencial.

const CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'";
const HDRS = { "Content-Security-Policy": CSP, "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
function html(status: number, body: string): HttpResponse { return { status, body, contentType: "text/html; charset=utf-8", headers: HDRS }; }
function tokenDe(path: string): string { return path.split("/")[2] ?? ""; }
const limiter = new RateLimiter(20); // 20 req/min por ip+path (publico)
async function limitado(ctx: RequestContext, path: string): Promise<boolean> {
  const xf = ctx.headers["x-forwarded-for"]; const ip = String(Array.isArray(xf) ? xf[0] : xf ?? "local");
  return !(await limiter.check(ip, path)).ok; // true = rate_limited
}

export function rutaVerCotizacion(): RouteDefinition {
  return { method: "GET", path: "/q/:token", handler: async (ctx) => {
    if (await limitado(ctx, "/q/view")) return html(429, pageSimple("Demasiadas solicitudes. Intenta en un minuto."));
    const q = await leerCotizacionPorToken(tokenDe(ctx.path));
    return q ? html(200, renderQuotePage(tokenDe(ctx.path), q)) : html(404, pageSimple("No encontramos esta cotizacion."));
  } };
}

export function rutaDecidirCotizacion(decision: "accepted" | "rejected", path: string): RouteDefinition {
  return { method: "POST", path, handler: async (ctx) => {
    if (await limitado(ctx, path)) return html(429, pageSimple("Demasiadas solicitudes. Intenta en un minuto."));
    const token = tokenDe(ctx.path);
    if (!(await decidirCotizacion(token, decision))) return html(404, pageSimple("No encontramos esta cotizacion."));
    const q = await leerCotizacionPorToken(token);
    return q ? html(200, renderQuotePage(token, q)) : html(200, pageSimple("Listo."));
  } };
}
