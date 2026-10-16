/**
 * HUB by Raisen — Composición de deps de canales sociales (Slide 4.2a).
 * Inyecta Zernio credentials, handlers y repo. C4 ≤75.
 */
import { ConnectSocialAccountHandler } from "../channels/application/connect-social-account.handler.ts";
import { ZernioSyncHandler } from "../channels/application/zernio-sync.handler.ts";
import { ChannelConnectionsRepo } from "../channels/infrastructure/channel-connections.repository.ts";
import type { ChannelsDeps } from "../channels/presentation/channels.routes.ts";

declare const process: { env: Record<string, string | undefined> };
function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export function buildChannelsDeps(): ChannelsDeps {
  const apiKey = getEnv("ZERNIO_API_KEY") ?? "";
  const baseUrl = getEnv("HUB_PUBLIC_URL") ?? "http://localhost:8080";
  const repo = new ChannelConnectionsRepo();
  return {
    connectHandler: new ConnectSocialAccountHandler(apiKey, baseUrl),
    syncHandler: new ZernioSyncHandler(apiKey, repo),
    repo,
    zernioApiKey: apiKey,
  };
}