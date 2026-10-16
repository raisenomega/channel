/**
 * HUB by Raisen — Repositorio Supabase de channel_connections (Slide 4.2a).
 * CRUD con RLS. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelConnection, SocialPlatform, ConnectionStatus } from "../domain/social-account.entity.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface Row { id: string; tenant_id: string; platform: string; zernio_account_id: string | null; handle: string | null; followers_count: number | null; status: string; is_primary: boolean; is_paused: boolean; auto_publish_allowed: boolean; created_at: string; updated_at: string; }

export class ChannelConnectionsRepo {
  async listar(tenantId: TenantId): Promise<Result<readonly ChannelConnection[], string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/channel_connections?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&order=platform.asc`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as Row[];
      return ok(Object.freeze(rows.map((x) => this.toEntity(x))));
    } catch (e) { return err(String(e)); }
  }

  async guardar(conn: ChannelConnection): Promise<Result<void, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/channel_connections`, { method: "POST", headers: h, body: JSON.stringify({ id: conn.id, tenant_id: conn.tenantId, platform: conn.platform, zernio_account_id: conn.zernioAccountId, handle: conn.handle, followers_count: conn.followersCount, status: conn.status, is_primary: conn.isPrimary, is_paused: conn.isPaused, auto_publish_allowed: conn.autoPublishAllowed, created_at: conn.createdAt, updated_at: conn.updatedAt }) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  private toEntity(r: Row): ChannelConnection {
    return { id: r.id, tenantId: r.tenant_id, platform: r.platform as SocialPlatform, zernioAccountId: r.zernio_account_id, handle: r.handle, followersCount: r.followers_count, status: r.status as ConnectionStatus, isPrimary: r.is_primary, isPaused: r.is_paused, autoPublishAllowed: r.auto_publish_allowed, createdAt: r.created_at, updatedAt: r.updated_at };
  }
}