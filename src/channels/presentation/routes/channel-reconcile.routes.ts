/**
 * HUB by Raisen — POST /tenants/:id/channels/reconcile. Sincroniza channel_connections con las
 * cuentas REALES del tenant en Zernio (listOwnAccounts por profileId) y las upserta como
 * status="connected". Sostiene el chip verde SIN depender del redirect del callback (que a veces no
 * persiste). requireTenantAuth(:id==claim). Idempotente (upsert por tenant+platform). C4 <=75.
 */
import type { RouteDefinition, RequestContext } from "../../../server/server-types.ts";
import { requireTenantAuth } from "../../../server/auth-helpers.ts";
import type { TenantId } from "../../../shared/domain/ids.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { ChannelConnection, SocialPlatform } from "../../domain/social-account.entity.ts";

const seg = (ctx: RequestContext, k: string, i: number): string => ctx.params[k] ?? ctx.path.split("/")[i] ?? "";
const VALID: ReadonlySet<string> = new Set(["whatsapp", "instagram", "facebook", "telegram", "sms", "x", "linkedin"]);

export interface ReconcileDeps {
  readonly profileService: { ensureProfileForTenant(id: TenantId): Promise<Result<{ zernioProfileId: string }, { readonly kind: string }>> };
  readonly connRepo: { guardar(conn: ChannelConnection): Promise<Result<void, string>> };
  readonly listOwnAccounts: (profileId: string) => Promise<ReadonlyArray<{ readonly id: string; readonly platform: string; readonly handle: string | null }>>;
}

export function rutaChannelReconcile(deps: ReconcileDeps): RouteDefinition {
  return {
    method: "POST", path: "/tenants/:id/channels/reconcile",
    handler: async (ctx: RequestContext) => {
      const auth = await requireTenantAuth(ctx, seg(ctx, "id", 2)); if (!auth.ok) return auth.error;
      const tenantId = auth.value.tenantId as TenantId;
      const prof = await deps.profileService.ensureProfileForTenant(tenantId);
      if (!prof.ok) return { ok: true, reconciled: 0 }; // sin profile -> nada en Zernio que reconciliar
      const accts = await deps.listOwnAccounts(prof.value.zernioProfileId);
      const now = new Date().toISOString();
      let n = 0;
      for (const a of accts) {
        if (!VALID.has(a.platform)) continue; // ignora plataformas fuera del CHECK de la tabla
        const r = await deps.connRepo.guardar({ id: crypto.randomUUID(), tenantId, platform: a.platform as SocialPlatform, zernioAccountId: a.id, handle: a.handle, followersCount: null, status: "connected", isPrimary: false, isPaused: false, autoPublishAllowed: false, createdAt: now, updatedAt: now });
        if (r.ok) n++;
      }
      return { ok: true, reconciled: n };
    },
  };
}
