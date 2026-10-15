import { expect, test } from "vitest";
import { LIMITS, ACCIONES_PROHIBIDAS, PRINCIPIOS_LITERALES } from "../../../src/cognition/domain/limits.ts";

test("P1: LIMITS tiene MIN_CONFIDENCE_TO_ACT = 7", () => {
  expect(LIMITS.MIN_CONFIDENCE_TO_ACT).toBe(7);
});

test("P2: nuevas props de Slide 4.0 existen", () => {
  expect(LIMITS.MIN_RITMO_RESPUESTA_MS).toBe(15_000);
  expect(LIMITS.MAX_RITMO_RESPUESTA_MS).toBe(45_000);
  expect(LIMITS.MONTO_SIN_HANDOFF_HUMANO_USD).toBe(500);
});

test("P3: ACCIONES_PROHIBIDAS tiene 14 items (9 legacy + 5 nuevas)", () => {
  expect(ACCIONES_PROHIBIDAS.size).toBe(14);
});

test("P4: las 5 acciones nuevas están presentes", () => {
  expect(ACCIONES_PROHIBIDAS.has("revelar_datos_otro_tenant")).toBe(true);
  expect(ACCIONES_PROHIBIDAS.has("operar_sin_disclosure_IA_en_whatsapp")).toBe(true);
  expect(ACCIONES_PROHIBIDAS.has("procesar_pago_fuera_de_landing_oficial_HUB")).toBe(true);
  expect(ACCIONES_PROHIBIDAS.has("simular_ser_humano_cuando_cliente_pregunta")).toBe(true);
  expect(ACCIONES_PROHIBIDAS.has("consultar_OMEGA_NUCLEO_sin_puerta_de_pago")).toBe(true);
});

test("P5: ACCIONES_PROHIBIDAS es Object.freeze + ReadonlySet", () => {
  expect(Object.isFrozen(ACCIONES_PROHIBIDAS)).toBe(true);
});

test("P6: mutar LIMITS da TypeError frozen", () => {
  expect(() => { (LIMITS as Record<string, unknown>).MIN_CONFIDENCE_TO_ACT = 5; }).toThrow();
});

test("P7: PRINCIPIOS_LITERALES contiene P1-P8 completos", () => {
  const KEYS = ["P1_VERDAD_BRUTAL", "P2_REPUTACION_CLIENTE_FINAL", "P3_CONVICCION_MINIMA",
    "P4_ANTI_IMPULSIVIDAD", "P5_APRENDIZAJE_HONESTO", "P6_SOBERANIA_TENANT",
    "P7_META_COMPLIANCE", "P8_RITMO_HUMANO"];
  for (const k of KEYS) {
    expect((PRINCIPIOS_LITERALES as Record<string, string>)[k]).toBeDefined();
  }
});

test("P8: PRINCIPIOS_LITERALES no tiene propiedades extra", () => {
  expect(Object.keys(PRINCIPIOS_LITERALES).length).toBe(8);
});

test("P9: ACCIONES_PROHIBIDAS legacy (9) siguen presentes", () => {
  const legacy = ["borrar_dato_cliente", "modificar_monto_cobro", "contactar_sin_consentimiento",
    "enviar_mensaje_fuera_horario_tenant", "revelar_informacion_interna",
    "modificar_configuracion_tenant", "ejecutar_sql_arbitrario",
    "cobrar_sin_confirmacion", "modificar_precios_sin_autorizacion"];
  for (const a of legacy) {
    expect(ACCIONES_PROHIBIDAS.has(a)).toBe(true);
  }
});