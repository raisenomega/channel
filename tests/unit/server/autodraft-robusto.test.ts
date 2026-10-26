/**
 * HUB by Raisen — ejecutor robusto: reintenta SOLO en error transitorio; responded/no_send no reintentan.
 */
import { expect, test } from "vitest";
import { ejecutarRobusto } from "../../../src/server/autodraft-robusto.ts";
import type { MaybeAutodraftService, AutodraftOutcome } from "../../../src/cognition/application/maybe-autodraft.service.ts";

function stub(outcomes: AutodraftOutcome[]) {
  let i = 0;
  const svc = { ejecutar: async () => outcomes[Math.min(i++, outcomes.length - 1)] } as unknown as MaybeAutodraftService;
  return { svc, calls: () => i };
}
const ev = { tenantId: "t", channel: "whatsapp", from: "+1", content: "hola" } as never;

test("RB-01 responded -> 1 solo intento", async () => {
  const s = stub([{ outcome: "responded", reason: "ok" }]);
  await ejecutarRobusto(s.svc, ev);
  expect(s.calls()).toBe(1);
});
test("RB-02 error luego responded -> reintenta (2 intentos)", async () => {
  const s = stub([{ outcome: "error", reason: "hipo" }, { outcome: "responded", reason: "ok" }]);
  await ejecutarRobusto(s.svc, ev);
  expect(s.calls()).toBe(2);
});
test("RB-03 no_send -> NO reintenta", async () => {
  const s = stub([{ outcome: "no_send", reason: "off" }]);
  await ejecutarRobusto(s.svc, ev);
  expect(s.calls()).toBe(1);
});
