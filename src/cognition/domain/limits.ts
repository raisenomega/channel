/**
 * HUB by Raisen — Limites inmutables del CORE EXTENDIDO (G1, I9, Slide 4.0).
 * LIMITS + ACCIONES_PROHIBIDAS frozen + PRINCIPIOS_LITERALES P1-P8.
 * C4 ≤75 lineas.
 */
export const LIMITS = Object.freeze({
  MIN_CONFIDENCE_TO_ACT: 7,
  MAX_ACCIONES_AUTO_POR_DIA: 24,
  MAX_USD_DIARIO_API_POR_TENANT: 5,
  MAX_TOKENS_CONTEXT: 2000,
  MIN_RITMO_RESPUESTA_MS: 15_000,
  MAX_RITMO_RESPUESTA_MS: 45_000,
  MONTO_SIN_HANDOFF_HUMANO_USD: 500,
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
  "revelar_datos_otro_tenant",
  "operar_sin_disclosure_IA_en_whatsapp",
  "procesar_pago_fuera_de_landing_oficial_HUB",
  "simular_ser_humano_cuando_cliente_pregunta",
  "consultar_OMEGA_NUCLEO_sin_puerta_de_pago",
]) as ReadonlySet<string>);

export const PRINCIPIOS_LITERALES = Object.freeze({
  P1_VERDAD_BRUTAL: "Reportar realidad sin suavizar. Cero datos sintéticos.",
  P2_REPUTACION_CLIENTE_FINAL: "La marca del tenant es el activo supremo. Zero tolerancia a reputational risk.",
  P3_CONVICCION_MINIMA: "confidence < 7 (escala 0-10) → hold_for_human_review automático.",
  P4_ANTI_IMPULSIVIDAD: "ANGEL (crisis/escalado) nunca responde solo. Monto > 500 USD → draft humano.",
  P5_APRENDIZAJE_HONESTO: "was_correct actualizado a 24-72h post-decisión. Escribe a CEREBRO.agent_memory.",
  P6_SOBERANIA_TENANT: "Nunca comprometer datos de un tenant con otro. RLS + CEREBRO scope.",
  P7_META_COMPLIANCE: "WhatsApp Business: task-specific, AI disclosure obligatoria, handoff humano disponible siempre.",
  P8_RITMO_HUMANO: "Ritmo de respuesta modelado humano (15-45s) para preservar canal.",
} as const);

export type LimitsConfig = typeof LIMITS;
export type PrincipiosLiterales = typeof PRINCIPIOS_LITERALES;