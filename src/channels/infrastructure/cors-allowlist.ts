/**
 * HUB by Raisen — O-9/Compuerta #40: allowlist de origins para el callback OAuth.
 * El `origin` viene FIRMADO dentro del state (HMAC) y ademas se RE-VALIDA aqui contra
 * CORS_ORIGINS_ALLOWLIST (segunda verificacion, anti open-redirect). C4 <=75.
 */
function env(n: string): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (d?.env?.get ? d.env.get(n) : p?.env?.[n]) ?? "";
}
export function corsAllowlist(): readonly string[] {
  return env("CORS_ORIGINS_ALLOWLIST").split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}
export function originPermitido(origin: string): boolean {
  if (!origin) return false;
  return corsAllowlist().includes(origin);
}
