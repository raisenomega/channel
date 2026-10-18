/**
 * HUB by Raisen — Helpers Supabase REST compartidos.
 * C4 ≤40 lineas.
 */
declare const process: { env: Record<string, string | undefined> };

export function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

// PostgREST vive en {SUPABASE_URL}/rest/v1/<tabla>. SUPABASE_URL es la base del proyecto (lo exige
// supabase.client.ts/createClient), asi que aqui ANTEPONEMOS /rest/v1 para el raw-fetch. Idempotente:
// si el env ya lo trae, no lo duplica. Sin esto, todo raw-fetch (channel_connections, oauth_nonces,
// orders, etc.) pegaba a {base}/<tabla> -> 404 -> persistence_error (bug raiz del saga OAuth).
export function supabaseBase(): string | null {
  const u = getEnv("SUPABASE_URL");
  if (!u) return null;
  const b = u.replace(/\/+$/, "");
  return b.endsWith("/rest/v1") ? b : `${b}/rest/v1`;
}
export function supabaseHdrs(): Record<string, string> | null {
  const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return k ? { apikey: k, Authorization: `Bearer ${k}`, "content-type": "application/json" } : null;
}