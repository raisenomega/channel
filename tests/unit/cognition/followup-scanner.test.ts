/**
 * HUB by Raisen — Sistema B fase 1: el scanner cuenta las conversaciones quietas que le da el puerto.
 */
import { expect, test } from "vitest";
import { FollowupScanner, type QuietConv } from "../../../src/cognition/application/followup-scanner.ts";

test("SB1-01 escanear devuelve la cantidad de quietas", async () => {
  const quietas: QuietConv[] = [
    { id: "c1", tenantId: "t1", contactId: "k1", lastMessageAt: "2026-10-24T10:00:00Z" },
    { id: "c2", tenantId: "t1", contactId: null, lastMessageAt: null },
  ];
  const n = await new FollowupScanner(() => Promise.resolve(quietas)).escanear(5);
  expect(n).toBe(2);
});

test("SB1-02 sin quietas -> 0", async () => {
  const n = await new FollowupScanner(() => Promise.resolve([])).escanear(5);
  expect(n).toBe(0);
});
