/**
 * HUB by Raisen — S7b: debeAutoEnviar + dentroDeHorario (guardrails puros del auto-envio).
 */
import { expect, test } from "vitest";
import { debeAutoEnviar, dentroDeHorario, razonAutoEnvio, type AutoSendSignals } from "../../../src/cognition/domain/autonomy-decision.ts";
import { DEFAULT_CONFIG } from "../../../src/cognition/domain/agents-config.ts";

const base: AutoSendSignals = { opportunity: false, complaint: false, newContact: false, confidence: 9, channel: "whatsapp", sentToday: 0 };
const now = new Date("2026-10-26T14:00:00"); // lunes 2pm

test("AD-01 autonomo + rutina + confianza alta -> true", () => {
  expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, base, now)).toBe(true);
});
test("AD-02 supervised -> false", () => { expect(debeAutoEnviar("supervised", DEFAULT_CONFIG, base, now)).toBe(false); });
test("AD-03 oportunidad -> false (bloqueado por review)", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, opportunity: true }, now)).toBe(false); });
test("AD-04 queja -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, complaint: true }, now)).toBe(false); });
test("AD-05 confianza < umbral -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, confidence: 7 }, now)).toBe(false); });
test("AD-06 canal no autorizado -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, channel: "telegram" }, now)).toBe(false); });
test("AD-07 tope diario alcanzado -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, sentToday: 24 }, now)).toBe(false); });
test("AD-08 horario: fuera de dia/franja -> false", () => {
  const cfg = { ...DEFAULT_CONFIG, hours: { days: [0, 1, 2, 3, 4], start: "08:00", end: "18:00" } };
  expect(dentroDeHorario(cfg.hours, new Date("2026-10-25T14:00:00"))).toBe(false); // domingo
  expect(debeAutoEnviar("autonomous", cfg, base, new Date("2026-10-26T20:00:00"))).toBe(false); // 8pm
  expect(debeAutoEnviar("autonomous", cfg, base, now)).toBe(true); // lun 2pm
});

test("AD-09 razon: supervisado -> no envia y lo dice", () => {
  const r = razonAutoEnvio("supervised", DEFAULT_CONFIG, base, now);
  expect(r.send).toBe(false);
  expect(r.reason).toContain("supervised");
});

test("AD-10 razon: confianza baja -> no envia y muestra el umbral", () => {
  const r = razonAutoEnvio("autonomous", DEFAULT_CONFIG, { ...base, confidence: 3 }, now);
  expect(r.send).toBe(false);
  expect(r.reason).toContain("confianza 3");
});

test("AD-11 razon: todo ok -> auto-enviado", () => {
  expect(razonAutoEnvio("autonomous", DEFAULT_CONFIG, base, now).reason).toBe("auto-enviado");
});
