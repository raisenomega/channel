import { expect, test } from "vitest";
import { platformLabel, isConnected, accountFollowers, allConnected, connectButtonState } from "../../../src/lib/zernioConnect.ts";
import type { ConnectedItem } from "../../../src/lib/zernioConnect.ts";

const items: ConnectedItem[] = [
  { platform: "instagram", handle: "@miNeg", zernio_account_id: "z1", followers_count: 1500 },
  { platform: "facebook", handle: null, zernio_account_id: "z2" },
];

test("platformLabel: conocida -> label", () => {
  expect(platformLabel("instagram")).toBe("Instagram");
});

test("platformLabel: desconocida -> mismo string", () => {
  expect(platformLabel("telegram")).toBe("telegram");
});

test("isConnected: true si existe en items", () => {
  expect(isConnected("instagram", items)).toBe(true);
  expect(isConnected("x", items)).toBe(false);
});

test("accountFollowers: devuelve numero si presente", () => {
  expect(accountFollowers("instagram", items)).toBe(1500);
});

test("A-13 P1_FOLLOWERS_NULL: followers ausente -> null (no 0)", () => {
  expect(accountFollowers("facebook", items)).toBeNull();
});

test("accountFollowers: no conectada -> null", () => {
  expect(accountFollowers("linkedin", items)).toBeNull();
});

test("allConnected: todas las plataformas conectadas", () => {
  expect(allConnected(["instagram", "facebook"], items)).toBe(true);
  expect(allConnected(["instagram", "x"], items)).toBe(false);
});

test("allConnected: empty platforms -> false", () => {
  expect(allConnected([], items)).toBe(false);
});

test("A-12 UX_AWAITING_PERSISTE: popup cerrado sin autorizar -> awaiting -> permite re-Vincular", () => {
  // flujo completo: inicial (connect) -> abre popup (awaiting) -> cierra sin autorizar (awaiting persiste) -> puede reintentar (vuelve a connect)
  expect(connectButtonState(false, false)).toBe("connect");
  expect(connectButtonState(false, true)).toBe("awaiting");
  expect(connectButtonState(false, true)).toBe("awaiting");
  expect(connectButtonState(false, false)).toBe("connect");
});

test("A-15 ZERNIO_CONNECT_BYTE_EQUIVALENT: helpers producen mismo output que OMEGA para inputs conocidos", () => {
  // Verificación funcional byte-equivalente: mismos inputs → mismos outputs
  const i: ConnectedItem[] = [{ platform: "instagram", handle: "@x", zernio_account_id: "z1", followers_count: 500 }];
  expect(platformLabel("instagram")).toBe("Instagram");
  expect(isConnected("instagram", i)).toBe(true);
  expect(isConnected("tiktok", i)).toBe(false);
  expect(accountFollowers("instagram", i)).toBe(500);
  expect(accountFollowers("facebook", i)).toBeNull();
  expect(allConnected(["instagram"], i)).toBe(true);
  expect(allConnected(["instagram", "x"], i)).toBe(false);
  expect(connectButtonState(true, false)).toBe("connected");
  expect(connectButtonState(false, true)).toBe("awaiting");
  expect(connectButtonState(false, false)).toBe("connect");
});