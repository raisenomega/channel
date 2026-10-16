/**
 * HUB by Raisen — Sincronizar estado real de conexión Zernio (Slide 4.2a).
 * R19: lógica idéntica a OMEGA zernio-sync hardened. Verifica contra GET /v1/accounts.
 * Hotfix G (D4): filtro Zernio por `platform` + filtro JS por enlaces del tenant (R20):
 * una cuenta de otro tenant jamas se reporta como "connected" aqui. C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { SocialPlatform, ConnectionStatus } from "../domain/social-account.entity.ts";
import { SOCIAL_PLATFORMS } from "../domain/social-account.entity.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelConnectionsRepo } from "../infrastructure/channel-connections.repository.ts";
import { filtrarPorTenant, listarCuentasZernio } from "../infrastructure/zernio-accounts.client.ts";

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
    const enlaces = await this.repo.listar(tenantId as TenantId);
    if (!enlaces.ok) return err("persistence_error");
    const cuentas = await listarCuentasZernio(this.zernioApiKey, platform);
    if (!cuentas.ok) return err("zernio_error");
    const account = filtrarPorTenant(cuentas.value, enlaces.value).find((a) => a.platform === platform);
    if (!account) return err("not_in_profile");
    return ok({ status: account.status, handle: account.handle, followersCount: account.followersCount });
  }
}
