/**
 * HUB by Raisen — O-3/O-9 + V/V2/V-vigía: GET /channels/zernio/callback (SIN JWT; trust anchor = state
 * firmado HMAC+TTL, idempotente desde V). frontBase re-valida origin vs CORS (nunca 403, Compuerta #40).
 * select_page -> stash + 302 needs_page; directo -> profileId match + persist. request_id trackable (#138).
 */
// PUBLIC: callback de redirect del navegador (Zernio no envia JWT). Trust anchor = state firmado
// HMAC+TTL (idempotente desde V) + re-validacion de origin vs CORS allowlist (frontBase, Compuerta #40).
import type { RouteDefinition, RequestContext, HttpResponse } from "../../../server/server-types.ts";
import { jsonResponse } from "../../../server/auth-helpers.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { TenantState } from "../../../identity/domain/tenant.entity.ts";
import type { ChannelConnection, SocialPlatform } from "../../domain/social-account.entity.ts";
import { verifyState } from "../../../identity/infrastructure/oauth-state.ts";
import { corsAllowlist, originPermitido } from "../../infrastructure/cors-allowlist.ts";
import { stashPending } from "../../infrastructure/oauth-pending-stash.ts";
import { nuevoReqId, logOauth } from "../../infrastructure/oauth-telemetry.ts";

export interface OAuthCallbackDeps {
  readonly noncesRepo: { consume(nonce: string): Promise<boolean> };
  readonly tenantRepo: { buscar(id: TenantId): Promise<Result<TenantState | null, { readonly kind: string }>> };
  readonly connRepo: { guardar(conn: ChannelConnection): Promise<Result<void, string>> };
  // #4 hardening: cuentas REALES del profile para re-validar el accountId (query NO firmado). Sin match -> NO persiste.
  readonly listOwnAccounts: (profileId: string) => Promise<ReadonlyArray<{ readonly id: string; readonly platform: string; readonly handle: string | null }>>;
}

const qp = (ctx: RequestContext, k: string): string => new URLSearchParams(ctx.path.includes("?") ? ctx.path.split("?")[1] : "").get(k) ?? "";
// V2 (#139): nunca 403 por origin. frontBase = origin (rstrip) si allowlisted, si no allowed[0] (fallback
// OMEGA). NUNCA redirige a un origen ajeno (anti open-redirect); el 403 rompia el relay en previews.
function frontBase(origin: string): string {
  const o = origin.replace(/\/+$/, "");
  if (originPermitido(o)) return o;                                    // Compuerta #40: re-valida origin vs allowlist
  return (corsAllowlist().map((x) => x.replace(/\/+$/, ""))[0]) ?? ""; // fallback OMEGA
}
function backToTab(origin: string, status: string, platform: string, reqId: string): HttpResponse {
  const loc = `${frontBase(origin)}/channels?oauth=${status}&platform=${encodeURIComponent(platform)}&req=${reqId}`;
  logOauth("zernio-callback", reqId, `302 -> ${status}`);
  return { status: 302, body: "", headers: { location: loc } };
}

export function rutaZernioCallback(deps: OAuthCallbackDeps): RouteDefinition {
  return {
    method: "GET", path: "/channels/zernio/callback",
    handler: async (ctx) => {
      const reqId = nuevoReqId();
      // V (#135/#136): nonce FIRMADO (CSRF) pero NO single-use; guards = firma HMAC + TTL + origin (frontBase).
      const v = await verifyState(qp(ctx, "st"), async () => true);
      if (!v.ok) { logOauth("zernio-callback", reqId, `verifyState FAIL ${JSON.stringify(v.error)}`); return jsonResponse(401, { ok: false, error: v.error }); }
      const { tenantId, platform, origin, userId } = v.value;
      logOauth("zernio-callback", reqId, `verifyState OK platform=${platform} tenant=${tenantId}`);
      // T-6: select_page NO trae profileId aun -> ANTES del guard de profileId (trust anchor = state firmado).
      if (qp(ctx, "step") === "select_page") {
        let up: unknown = null; try { up = JSON.parse(decodeURIComponent(qp(ctx, "userProfile"))); } catch { /* ilegible -> null */ }
        stashPending(userId, String(tenantId), platform, qp(ctx, "tempToken"), qp(ctx, "connect_token"), up);
        logOauth("zernio-callback", reqId, "step=select_page -> connect_token stashed");
        return backToTab(origin, "needs_page", platform, reqId);
      }
      const t = await deps.tenantRepo.buscar(tenantId as TenantId);
      if (!t.ok || !t.value || t.value.zernioProfileId !== qp(ctx, "profileId")) return backToTab(origin, "error", platform, reqId);
      const accountId = qp(ctx, "accountId");
      const accts = await deps.listOwnAccounts(qp(ctx, "profileId"));
      if (!accts.some((a) => a.id === accountId)) return backToTab(origin, "error", platform, reqId);
      // O-7 derive_bindings: barre TODAS las cuentas del profile (idempotente) -> ningun binding vacio.
      const now = new Date().toISOString();
      for (const a of accts) {
        await deps.connRepo.guardar({ id: crypto.randomUUID(), tenantId: tenantId as TenantId, platform: a.platform as SocialPlatform, zernioAccountId: a.id, handle: a.handle, followersCount: null, status: "connected", isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: now, updatedAt: now });
      }
      logOauth("zernio-callback", reqId, `persisted ${accts.length} accounts -> connected`);
      return backToTab(origin, "connected", platform, reqId);
    },
  };
}
