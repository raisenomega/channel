/**
 * HUB by Raisen — Sincronizar estado real de conexión Zernio (Slide 4.2a).
 * R19: lógica idéntica a OMEGA zernio-sync hardened. Verifica contra connected-accounts.
 * C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { SocialPlatform, ConnectionStatus } from "../domain/social-account.entity.ts";
import { SOCIAL_PLATFORMS } from "../domain/social-account.entity.ts";
import type { ChannelConnectionsRepo } from "../infrastructure/channel-connections.repository.ts";

export type SyncError = "platform_invalida" | "not_in_profile" | "zernio_error" | "persistence_error";

export interface SyncResult {
  readonly status: ConnectionStatus;
  readonly handle: string | null;
  readonly followersCount: number | null;
}

export class ZernioSyncHandler {
  constructor(
    private readonly zernioApiKey: string,
    private readonly repo: ChannelConnectionsRepo,
  ) {}

  async ejecutar(tenantId: string, platform: string): Promise<Result<SyncResult, SyncError>> {
    if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) return err("platform_invalida");
    try {
      const r = await fetch("https://api.zernio.io/v1/connected-accounts", {
        headers: { Authorization: `Bearer ${this.zernioApiKey}` },
      });
      if (!r.ok) return err("zernio_error");
      const data = await r.json() as { items?: Array<{ platform: string; handle?: string; followers_count?: number; zernio_account_id: string; status: string }> };
      const account = (data.items ?? []).find((a) => a.platform === platform);
      if (!account) return err("not_in_profile");
      const result: SyncResult = { status: account.status === "connected" ? "connected" : "awaiting", handle: account.handle ?? null, followersCount: account.followers_count ?? null };
      return ok(result);
    } catch { return err("zernio_error"); }
  }
}