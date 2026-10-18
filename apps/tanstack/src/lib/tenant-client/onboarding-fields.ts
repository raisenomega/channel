/**
 * HUB by Raisen — S-2/S-6: catalogo compartido de campos del onboarding del negocio.
 * Claves snake_case = columnas DB (el backend las lee tal cual del body + sanitizarPerfil).
 * Espejo frontend de los allow-lists del dominio (tenant-profile.ts). Reusado por el overlay
 * (create) y el drawer de edicion (S-10) y por los wrappers create-tenant/update-tenant.
 */

/** Campos de perfil (ademas de name/phone). Todos opcionales en DB (solo name obligatorio, #102). */
export interface Perfil {
  country_code: string; timezone: string; default_language: string;
  street: string; postal_code: string; city: string; region: string;
  legal_name: string; tax_id: string; industry: string;
  brand_tone: string; brand_services: string; brand_target_audience: string;
  operation_hours: string; expected_response_sla: string; brand_mission: string;
}

export type OnboardingForm = { name: string; phone: string } & Perfil;

export const BRAND_TONES = ["formal", "casual", "profesional", "amigable"] as const;
export const RESPONSE_SLAS = ["<1h", "<4h", "<24h", "best_effort"] as const;

export const ONBOARDING_DEFAULTS: OnboardingForm = {
  name: "", phone: "+1 787 ",
  country_code: "PR", timezone: "America/Puerto_Rico", default_language: "es",
  street: "", postal_code: "", city: "", region: "",
  legal_name: "", tax_id: "", industry: "",
  brand_tone: "", brand_services: "", brand_target_audience: "",
  operation_hours: "", expected_response_sla: "", brand_mission: "",
};
