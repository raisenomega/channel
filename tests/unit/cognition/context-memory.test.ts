/**
 * HUB by Raisen — memoria de contexto: se vence a los 15 dias (releer), antes sigue en memoria.
 */
import { expect, test } from "vitest";
import { memoriaVencida } from "../../../src/cognition/infrastructure/context-memory.query.ts";

const hace = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();

test("CM-01 recien guardada -> NO vencida", () => { expect(memoriaVencida(hace(0))).toBe(false); });
test("CM-02 14 dias -> NO vencida (sigue en memoria)", () => { expect(memoriaVencida(hace(14))).toBe(false); });
test("CM-03 16 dias -> vencida (relee el contexto)", () => { expect(memoriaVencida(hace(16))).toBe(true); });
