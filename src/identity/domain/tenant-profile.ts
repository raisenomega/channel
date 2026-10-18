/**
 * HUB by Raisen — S-6 (Compuerta #100): perfil del negocio del onboarding (datos fisicos + fiscales
 * + brand voice para Victor/CEREBRO). body y columnas DB son ambos snake_case, asi que sanitizar
 * devuelve columnas listas para insert/update. Descarta vacios (solo `name` obligatorio, #102) y
 * omite valores de enum invalidos (el CHECK de la migracion 052 es el guard duro final). C4 <=75.
 */

/** Campos de texto libre del perfil (snake_case = columna DB). */
const CAMPOS_TEXTO = [
  "street", "postal_code", "city", "region", "legal_name", "tax_id", "industry",
  "brand_services", "brand_target_audience", "operation_hours", "brand_mission",
] as const;

/** Enums (espejo exacto de los CHECK de 052). */
export const BRAND_TONES = ["formal", "casual", "profesional", "amigable"] as const;
export const RESPONSE_SLAS = ["<1h", "<4h", "<24h", "best_effort"] as const;

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Extrae del body las columnas de perfil validas y saneadas. Vacios -> omitidos (NULL en DB).
 * Enum invalido -> omitido (defensa en profundidad; el CHECK DB nunca llega a violarse). Tope
 * defensivo de 1000 chars por campo de texto (la UI aplica los limites precisos por campo).
 */
export function sanitizarPerfil(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of CAMPOS_TEXTO) {
    const v = texto(body[k]);
    if (v) out[k] = v.slice(0, 1000);
  }
  const tone = texto(body["brand_tone"]);
  if ((BRAND_TONES as readonly string[]).includes(tone)) out["brand_tone"] = tone;
  const sla = texto(body["expected_response_sla"]);
  if ((RESPONSE_SLAS as readonly string[]).includes(sla)) out["expected_response_sla"] = sla;
  return out;
}
