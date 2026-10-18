/**
 * HUB by Raisen — FORTRESS N-8/N-9: fail-fast de env de seguridad en arranque (produccion).
 * META_WEBHOOK_VERIFY_TOKEN (handshake webhooks) + OAUTH_STATE_SECRET (firma HMAC del state)
 * son obligatorias y >=32 chars en produccion. Fuera de produccion se permite arrancar.
 */
export function assertCriticalEnv(env: Record<string, string | undefined>): void {
  if ((env["NODE_ENV"] ?? "") !== "production") return;
  for (const name of ["META_WEBHOOK_VERIFY_TOKEN", "OAUTH_STATE_SECRET"]) {
    if ((env[name] ?? "").length < 32) {
      throw new Error(`[HUB] ${name} ausente o <32 chars — arranque rechazado (FORTRESS N)`);
    }
  }
}
