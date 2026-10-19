/**
 * HUB by Raisen — Z-2: lectura del perfil COMPLETO del tenant para el prefill de edición. Dato real
 * (service-role); el guard de app (requireTenantAuth :id==claim) protege cross-tenant en la ruta.
 * Devuelve las columnas tal cual (snake_case = claves de OnboardingForm en el front). C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const COLS =
  "name, phone, country_code, timezone, default_language, street, postal_code, city, region, " +
  "legal_name, tax_id, industry, brand_tone, brand_services, brand_target_audience, " +
  "operation_hours, expected_response_sla, brand_mission";

export async function leerPerfilTenant(
  id: TenantId,
): Promise<Result<Record<string, unknown> | null, { readonly kind: string }>> {
  try {
    const { data, error } = await supabase.from("tenants").select(COLS).eq("id", id).single();
    if (error) return err({ kind: "persistence_failure" });
    return ok((data as unknown as Record<string, unknown> | null) ?? null);
  } catch {
    return err({ kind: "persistence_failure" });
  }
}
