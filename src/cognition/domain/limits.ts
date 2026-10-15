/**
 * HUB by Raisen — Limites inmutables del CORE (G1, I9).
 * LIMITS + ACCIONES_PROHIBIDAS frozen. Referenciados en application.
 * C4 ≤75 lineas.
 */
export const LIMITS = Object.freeze({
  MIN_CONFIDENCE_TO_ACT: 7,
  MAX_ACCIONES_AUTO_POR_DIA: 24,
  MAX_USD_DIARIO_API_POR_TENANT: 5,
  MAX_TOKENS_CONTEXT: 2000,
} as const);

export const ACCIONES_PROHIBIDAS: ReadonlySet<string> = Object.freeze(new Set<string>([
  "borrar_dato_cliente",
  "modificar_monto_cobro",
  "contactar_sin_consentimiento",
  "enviar_mensaje_fuera_horario_tenant",
  "revelar_informacion_interna",
  "modificar_configuracion_tenant",
  "ejecutar_sql_arbitrario",
  "cobrar_sin_confirmacion",
  "modificar_precios_sin_autorizacion",
]) as ReadonlySet<string>);

export type LimitsConfig = typeof LIMITS;