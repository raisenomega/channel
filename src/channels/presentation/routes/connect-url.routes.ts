/**
 * HUB by Raisen — O-3: GET /tenants/:id/channels/:platform/connect-url.
 * requireTenantAuth (Compuerta #17) -> ensureProfile (O-6) -> firma state N-9 con
 * origin+userId+nonce -> embebe en redirectUrl (?st=) -> pide auth_url a Zernio (patron
 * OMEGA: Zernio no tiene state nativo). Devuelve auth_url para el popup del frontend. C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../../server/auth-helpers.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { ZernioProfileService, EnsureProfileError } from "../../application/zernio-profile.service.ts";
import type { OAuthNoncesRepository } from "../../../oauth/infrastructure/oauth-nonces.repository.supabase.ts";
import { signState, nuevoNonce } from "../../../identity/infrastructure/oauth-state.ts";
import { fetchConnectUrl, type ZernioConnectError } from "../../infrastructure/zernio-connect.client.ts";

export interface OAuthConnectDeps {
  readonly profileService: ZernioProfileService;
  readonly noncesRepo: OAuthNoncesRepository;
  readonly apiKey: string;
  readonly redirectBase: string;
}

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? ctx.path.split("/")[i] ?? "";
const hdr = (ctx: RequestContext, k: string): string => { const v = ctx.headers[k] ?? ctx.headers[k.toLowerCase()]; return Array.isArray(v) ? (v[0] ?? "") : (v ?? ""); };
const profErr = (e: EnsureProfileError) => jsonResponse(e.kind === "tenant_not_found" ? 404 : e.kind === "zernio_no_configurado" ? 503 : e.kind === "persistence_error" ? 500 : 502, { ok: false, error: e });
const zErr = (e: ZernioConnectError) => jsonResponse(e.kind === "no_configurado" ? 503 : 502, { ok: false, error: e });

export function rutaChannelConnectUrl(deps: OAuthConnectDeps): RouteDefinition {
  return {
    method: "GET", path: "/tenants/:id/channels/:platform/connect-url",
    handler: async (ctx) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const platform = seg(ctx, "platform", 4);
      const tenantId = auth.value.tenantId as TenantId;
      const prof = await deps.profileService.ensureProfileForTenant(tenantId); if (!prof.ok) return profErr(prof.error);
      const nonce = nuevoNonce();
      await deps.noncesRepo.registrar(nonce, auth.value.tenantId);
      const st = await signState({ tenantId: auth.value.tenantId, platform, origin: hdr(ctx, "Origin"), userId: auth.value.userId, nonce, ts: Date.now() });
      if (!st.ok) return jsonResponse(500, { ok: false, error: st.error });
      // #7: sanea OAUTH_REDIRECT_BASE con URL() -> solo scheme://host (descarta path pegado);
      // si no es http(s)://host valido, falla claro (Zernio rechaza un redirectUrl relativo).
      let cbUrl: string;
      try { const u = new URL(deps.redirectBase); cbUrl = `${u.protocol}//${u.host}/channels/zernio/callback?st=${encodeURIComponent(st.value)}`; }
      catch { return jsonResponse(500, { ok: false, error: { kind: "oauth_redirect_base_invalida" } }); }
      const r = await fetchConnectUrl(deps.apiKey, platform, prof.value.zernioProfileId, cbUrl); if (!r.ok) return zErr(r.error);
      return { ok: true, auth_url: r.value.authUrl };
    },
  };
}
