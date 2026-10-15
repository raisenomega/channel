/**
 * HUB by Raisen — Helpers Supabase REST compartidos.
 * C4 ≤40 lineas.
 */
declare const process: { env: Record<string, string | undefined> };

export function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export function supabaseBase(): string | null { return getEnv("SUPABASE_URL") ?? null; }
export function supabaseHdrs(): Record<string, string> | null {
  const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return k ? { apikey: k, Authorization: `Bearer ${k}`, "content-type": "application/json" } : null;
}