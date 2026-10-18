/**
 * HUB by Raisen — M-6 bootstrap: registra el fallback real (sub->users.tenant_id)
 * en auth-helpers. Importado SOLO por el entrypoint del server (hub.server.ts),
 * nunca por tests (asi el Deno.exit de supabase.client no corre en vitest).
 * C4 <=75.
 */
import { setTenantFallback } from "./auth-helpers.ts";
import { supabase } from "../shared/infrastructure/supabase.client.ts";

setTenantFallback(async (sub: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", sub)
      .maybeSingle();
    if (error || !data?.tenant_id) return null;
    return String(data.tenant_id);
  } catch {
    return null;
  }
});
