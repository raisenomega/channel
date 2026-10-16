/**
 * HUB by Raisen — Composicion del ChannelRouter (Hotfix B).
 * Registra DevChannelAdapter siempre y ZernioAdapter cuando hay credenciales
 * (Vault primero, env fallback). Sin credenciales: degraded-mode anunciado
 * por warn, nunca throw. Nunca loguea valores de secretos. C4 <=75.
 */
import { ChannelRouter } from "../channels/application/channel.router.ts";
import { DevChannelAdapter } from "../channels/infrastructure/dev-channel.adapter.ts";
import { ZernioAdapter } from "../channels/infrastructure/zernio.adapter.ts";
import { ZernioCredentialsRepository } from "../channels/infrastructure/zernio.credentials.ts";

export interface ChannelRouterDeps {
  readonly creds: ZernioCredentialsRepository;
  readonly warn: (msg: string) => void;
}

const DEFAULT_DEPS: ChannelRouterDeps = Object.freeze({
  creds: new ZernioCredentialsRepository(),
  warn: (msg: string): void => {
    console.warn(msg);
  },
});

export async function buildChannelRouter(deps: ChannelRouterDeps = DEFAULT_DEPS): Promise<ChannelRouter> {
  const router = new ChannelRouter();
  router.registrar(new DevChannelAdapter());
  const creds = await deps.creds.leer();
  if (creds.ok) {
    router.registrar(new ZernioAdapter(creds.value.webhookSecret, creds.value.apiKey));
    return router;
  }
  deps.warn(
    `[HUB] ZernioAdapter NO registrado: ${creds.error.kind}:${creds.error.nombre}. ` +
      "/webhooks/zernio respondera adapter_no_registrado.",
  );
  return router;
}
