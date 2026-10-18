/**
 * HUB by Raisen — O-4: page picker de Facebook (JWT). pending-pages lista las paginas del
 * consent (desde el stash server-side); select-page valida que la pagina pertenezca al consent
 * (403 si ajena) y la adjunta al profile + persiste + limpia el stash. Tokens NUNCA al cliente. C4 <=75.
 */
import type { RouteDefinition, RequestContext, HttpResponse } from "../../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../../server/auth-helpers.ts";
import { obj } from "../../../server/server-helpers.ts";
import { ok, err } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { TenantState } from "../../../identity/domain/tenant.entity.ts";
import type { ChannelConnection, SocialPlatform } from "../../domain/social-account.entity.ts";
import { getFacebookPages, selectFacebookPage, type FbPage } from "../../infrastructure/zernio-facebook.client.ts";
import { getPending, clearPending } from "../../infrastructure/oauth-pending-stash.ts";
import { logOauth, reqIdDeQuery } from "../../infrastructure/oauth-telemetry.ts";

export interface OAuthFbDeps {
  readonly apiKey: string;
  readonly tenantRepo: { buscar(id: TenantId): Promise<Result<TenantState | null, { readonly kind: string }>> };
  readonly connRepo: { guardar(conn: ChannelConnection): Promise<Result<void, string>> };
}
const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? ctx.path.split("/")[i] ?? "";
interface FbCtx { userId: string; tenantId: string; pid: string; pending: { tempToken: string; connectToken: string; userProfile: unknown }; pages: readonly FbPage[]; }

async function fbContexto(deps: OAuthFbDeps, ctx: RequestContext): Promise<Result<FbCtx, HttpResponse>> {
  const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return err(auth.error);
  const userId = auth.value.userId; const tenantId = String(auth.value.tenantId);
  const t = await deps.tenantRepo.buscar(auth.value.tenantId as TenantId);
  const pid = t.ok && t.value ? t.value.zernioProfileId : null;
  if (!pid) return err(jsonResponse(409, { ok: false, error: { kind: "no_zernio_profile" } }));
  const pending = getPending(userId, tenantId, "facebook");
  if (!pending) return err(jsonResponse(409, { ok: false, error: { kind: "no_pending_facebook_oauth" } }));
  const pages = await getFacebookPages(deps.apiKey, pending.connectToken, pending.tempToken, pid);
  if (!pages.ok) return err(jsonResponse(502, { ok: false, error: { kind: "zernio_fb_error" } }));
  return ok({ userId, tenantId, pid, pending, pages: pages.value });
}

export function rutaPendingPages(deps: OAuthFbDeps): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/channels/facebook/pending-pages", handler: async (ctx) => {
    const c = await fbContexto(deps, ctx); if (!c.ok) return c.error;
    logOauth("pending-pages", reqIdDeQuery(ctx.path), `tenant=${c.value.tenantId} -> ${c.value.pages.length} pages (X-Connect-Token forwarded)`);
    return { ok: true, pages: c.value.pages };
  } };
}

export function rutaSelectPage(deps: OAuthFbDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/channels/facebook/select-page", handler: async (ctx) => {
    const c = await fbContexto(deps, ctx); if (!c.ok) return c.error;
    const pageId = String(obj(ctx.body)["page_id"] ?? "");
    if (!c.value.pages.some((p) => p.id === pageId)) return jsonResponse(403, { ok: false, error: { kind: "page_ajena_al_profile" } });
    logOauth("select-page", reqIdDeQuery(ctx.path), `pageId=${pageId} selected -> forwarding X-Connect-Token + persisting`);
    const sel = await selectFacebookPage(deps.apiKey, c.value.pending.connectToken, c.value.pending.tempToken, pageId, c.value.pid, c.value.pending.userProfile);
    if (!sel.ok) return jsonResponse(502, { ok: false, error: { kind: "zernio_fb_error" } });
    const now = new Date().toISOString();
    await deps.connRepo.guardar({ id: crypto.randomUUID(), tenantId: c.value.tenantId as unknown as string, platform: "facebook" as SocialPlatform, zernioAccountId: sel.value.accountId, handle: null, followersCount: null, status: "connected", isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: now, updatedAt: now });
    clearPending(c.value.userId, c.value.tenantId, "facebook");
    return { ok: true, accountId: sel.value.accountId };
  } };
}
