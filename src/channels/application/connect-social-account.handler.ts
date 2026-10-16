/**
 * HUB by Raisen — Conectar cuenta social vía OAuth Zernio (Slide 4.2a).
 * GET connect-url llama a Zernio REST API, retorna auth_url del popup OAuth.
 * C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { SocialPlatform } from "../domain/social-account.entity.ts";
import { SOCIAL_PLATFORMS } from "../domain/social-account.entity.ts";

export type ConnectUrlError = "platform_invalida" | "tenant_not_found" | "zernio_error";

export interface ConnectUrlResult {
  readonly authUrl: string;
}

export class ConnectSocialAccountHandler {
  constructor(
    private readonly zernioApiKey: string,
    private readonly baseUrl: string,
  ) {}

  async ejecutar(tenantId: string, platform: string): Promise<Result<ConnectUrlResult, ConnectUrlError>> {
    if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) return err("platform_invalida");
    try {
      const r = await fetch("https://api.zernio.io/v1/oauth/connect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.zernioApiKey}` },
        body: JSON.stringify({
          platform,
          tenant_id: tenantId,
          redirect_uri: `${this.baseUrl}/channels/zernio/return?platform=${platform}`,
        }),
      });
      if (!r.ok) return err("zernio_error");
      const data = await r.json() as { auth_url?: string };
      return data.auth_url ? ok({ authUrl: data.auth_url }) : err("zernio_error");
    } catch { return err("zernio_error"); }
  }
}