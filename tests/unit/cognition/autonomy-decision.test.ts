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
test("AD-03 oportunidad: por defecto RESPONDE igual (true); con review.opportunities ON -> false", () => {
  expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, opportunity: true }, now)).toBe(true);
  expect(debeAutoEnviar("autonomous", { ...DEFAULT_CONFIG, review: { ...DEFAULT_CONFIG.review, opportunities: true } }, { ...base, opportunity: true }, now)).toBe(false);
});
test("AD-04 queja: por defecto RESPONDE (true); con review.complaints ON -> false", () => {
  expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, complaint: true }, now)).toBe(true);
  expect(debeAutoEnviar("autonomous", { ...DEFAULT_CONFIG, review: { ...DEFAULT_CONFIG.review, complaints: true } }, { ...base, complaint: true }, now)).toBe(false);
});
test("AD-05 confianza: default 0 no bloquea; con umbral 8 y confianza 7 -> false", () => {
  expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, confidence: 2 }, now)).toBe(true);
  expect(debeAutoEnviar("autonomous", { ...DEFAULT_CONFIG, confidence: 8 }, { ...base, confidence: 7 }, now)).toBe(false);
});
test("AD-06 canal no autorizado -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, channel: "telegram" }, now)).toBe(false); });
test("AD-07 tope diario alcanzado -> false", () => { expect(debeAutoEnviar("autonomous", DEFAULT_CONFIG, { ...base, sentToday: 1000 }, now)).toBe(false); });
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

test("AD-10 razon: con umbral 8, confianza 3 -> no envia y muestra el umbral", () => {
  const r = razonAutoEnvio("autonomous", { ...DEFAULT_CONFIG, confidence: 8 }, { ...base, confidence: 3 }, now);
  expect(r.send).toBe(false);
  expect(r.reason).toContain("confianza 3");
});

test("AD-11 razon: todo ok -> auto-enviado", () => {
  expect(razonAutoEnvio("autonomous", DEFAULT_CONFIG, base, now).reason).toBe("auto-enviado");
});

test("AD-12 horario respeta la TZ del tenant (arregla bloqueo de tardes AST)", () => {
  const cfg = { ...DEFAULT_CONFIG, hours: { days: [0, 1, 2, 3, 4, 5], start: "08:00", end: "18:00" } };
  const t = new Date("2026-10-24T20:00:00Z"); // sabado 20:00 UTC = 16:00 AST
  expect(dentroDeHorario(cfg.hours, t, "America/Puerto_Rico")).toBe(true);  // 4pm AST -> dentro
  expect(dentroDeHorario(cfg.hours, t, "UTC")).toBe(false);                 // 20:00 UTC -> fuera (el bug viejo)
  const noche = new Date("2026-10-24T22:15:00Z"); // 18:15 AST -> fuera (pasa 6pm)
  expect(dentroDeHorario(cfg.hours, noche, "America/Puerto_Rico")).toBe(false);
});
