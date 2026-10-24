/**
 * HUB by Raisen — Cliente Supabase (service-role). LAZY: createClient se ejecuta al PRIMER uso, no al
 * importar el modulo -> seguro de importar en Node (tests) y en Deno (prod). getEnv maneja ambos runtimes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./supabase-rest.helper.ts";

let _client: SupabaseClient | undefined;

function cliente(): SupabaseClient {
  if (!_client) {
    const url = getEnv("SUPABASE_URL") ?? "";
    const key = getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !key) console.error("[HUB] ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.");
    _client = createClient(url, key, {
      db: { schema: "public" },
      global: { headers: { "x-tenant-id": "", "x-app-name": "hub-by-raisen" } },
      auth: { persistSession: false, autoRefreshToken: true },
    });
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop: string | symbol): unknown {
    const c = cliente() as unknown as Record<string | symbol, unknown>;
    const v = c[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(c) : v;
  },
});
