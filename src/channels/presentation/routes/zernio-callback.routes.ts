/**
 * HUB by Raisen — O-3/O-9: GET /channels/zernio/callback?st=...&profileId=...&accountId=...
 * SIN JWT: el state firmado (N-9) es el unico trust anchor. Verifica: (1) firma HMAC+nonce+TTL,
 * (2) origin firmado vs CORS_ORIGINS_ALLOWLIST (Compuerta #40, anti open-redirect), (3) aislamiento
 * multi-tenant: profileId del retorno == tenant.zernioProfileId. Luego persiste + vuelve al tab. C4 <=75.
 */
// PUBLIC: callback de redirect del navegador (Zernio no envia JWT). El trust anchor es el
// state firmado HMAC+nonce+TTL (N-9) + re-validacion de origin vs CORS allowlist (Compuerta #40).
import type { RouteDefinition, RequestContext, HttpResponse } from "../../../server/server-types.ts";
import { jsonResponse } from "../../../server/auth-helpers.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { TenantState } from "../../../identity/domain/tenant.entity.ts";
import type { ChannelConnection, SocialPlatform } from "../../domain/social-account.entity.ts";
import { verifyState } from "../../../identity/infrastructure/oauth-state.ts";
import { originPermitido } from "../../infrastructure/cors-allowlist.ts";
import { stashPending } from "../../infrastructure/oauth-pending-stash.ts";

export interface OAuthCallbackDeps {
  readonly noncesRepo: { consume(nonce: string): Promise<boolean> };
  readonly tenantRepo: { buscar(id: TenantId): Promise<Result<TenantState | null, { readonly kind: string }>> };
  readonly connRepo: { guardar(conn: ChannelConnection): Promise<Result<void, string>> };
  // #4 hardening: cuentas REALES del profile (Zernio) para re-validar el accountId del callback
  // (query param NO firmado) + handle autoritativo. Sin match -> NO persiste.
  readonly listOwnAccounts: (profileId: string) => Promise<ReadonlyArray<{ readonly id: string; readonly platform: string; readonly handle: string | null }>>;
}

const qp = (ctx: RequestContext, k: string): string => new URLSearchParams(ctx.path.includes("?") ? ctx.path.split("?")[1] : "").get(k) ?? "";
function backToTab(origin: string, status: string, platform: string): HttpResponse {
  return { status: 302, body: "", headers: { location: `${origin}/zernio/return?status=${status}&platform=${encodeURIComponent(platform)}` } };
}

export function rutaZernioCallback(deps: OAuthCallbackDeps): RouteDefinition {
  return {
    method: "GET", path: "/channels/zernio/callback",
    handler: async (ctx) => {
      const v = await verifyState(qp(ctx, "st"), (n) => deps.noncesRepo.consume(n));
      if (!v.ok) return jsonResponse(401, { ok: false, error: v.error });
      const { tenantId, platform, origin, userId } = v.value;
      if (!originPermitido(origin)) return jsonResponse(403, { ok: false, error: { kind: "origin_rejected" } });
      // T-6 (causa raiz del OAuth FB stuck): el callback step=select_page NO trae profileId todavia
      // (Zernio no ha finalizado el profile). Se maneja ANTES del guard de match de profileId; el
      // trust anchor del paso select_page es el STATE FIRMADO (userId/tenantId), no el query param.
      // Antes el guard de L42 bailaba con "error" y el stash+needs_page nunca ocurrian -> picker nunca
      // abria -> el POST a Zernio nunca llegaba (confirmado por Zernio support).
      if (qp(ctx, "step") === "select_page") {
        let up: unknown = null; try { up = JSON.parse(decodeURIComponent(qp(ctx, "userProfile"))); } catch { /* userProfile ilegible -> null (degrada honesto) */ }
        stashPending(userId, String(tenantId), platform, qp(ctx, "tempToken"), qp(ctx, "connect_token"), up);
        console.info(`[zernio-callback] step=select_page detectado, connect_token stashed (tenant=${tenantId} platform=${platform})`);
        return backToTab(origin, "needs_page", platform);
      }
      // Camino de persist directo (no select_page): AHORA si exige profileId match (aislamiento multi-tenant).
      const t = await deps.tenantRepo.buscar(tenantId as TenantId);
      if (!t.ok || !t.value || t.value.zernioProfileId !== qp(ctx, "profileId")) return backToTab(origin, "error", platform);
      const accountId = qp(ctx, "accountId");
      // #4: el accountId (query NO firmado) DEBE existir en el profile del tenant; si no, no persiste.
      const accts = await deps.listOwnAccounts(qp(ctx, "profileId"));
      if (!accts.some((a) => a.id === accountId)) return backToTab(origin, "error", platform);
      // O-7 derive_bindings: barre TODAS las cuentas del profile y las upsertea (idempotente,
      // on_conflict tenant_id,platform) -> ningun negocio nace con binding vacio. Best-effort.
      const now = new Date().toISOString();
      for (const a of accts) {
        await deps.connRepo.guardar({ id: crypto.randomUUID(), tenantId: tenantId as TenantId, platform: a.platform as SocialPlatform, zernioAccountId: a.id, handle: a.handle, followersCount: null, status: "connected", isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: now, updatedAt: now });
      }
      return backToTab(origin, "connected", platform);
    },
  };
}
