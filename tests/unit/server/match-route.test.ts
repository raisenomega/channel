import { expect, test } from "vitest";
import { matchRoute, matchParametricPath } from "../../../src/server/server-route-matcher.ts";
import type { RouteDefinition } from "../../../src/server/server-types.ts";

const h = async (): Promise<Record<string, unknown>> => ({ ok: true });
function ruta(method: RouteDefinition["method"], path: string): RouteDefinition {
  return { method, path, handler: h };
}
const RUTAS: RouteDefinition[] = [
  ruta("GET", "/"),
  ruta("GET", "/tenants/:id/channels"),
  ruta("GET", "/tenants/:id"),
  ruta("GET", "/tenants/me"),
  ruta("GET", "/pay/:tenantSlug/:orderId"),
  ruta("POST", "/notifications/:id/read"),
  ruta("GET", "/notifications"),
  ruta("GET", "/x"),
];

test("A-01 PARAM_SIMPLE: /tenants/abc/channels captura id", () => {
  const m = matchRoute(RUTAS, "GET", "/tenants/abc/channels");
  expect(m?.route.path).toBe("/tenants/:id/channels");
  expect(m?.params).toEqual({ id: "abc" });
});

test("A-02 PARAM_MULTIPLE: /pay/demo/xyz captura tenantSlug y orderId", () => {
  const m = matchRoute(RUTAS, "GET", "/pay/demo/xyz");
  expect(m?.route.path).toBe("/pay/:tenantSlug/:orderId");
  expect(m?.params).toEqual({ tenantSlug: "demo", orderId: "xyz" });
});

test("A-03 PARAM_URL_ENCODED: %2F se decodifica a /", () => {
  const m = matchRoute(RUTAS, "GET", "/tenants/a%2Fb/channels");
  expect(m?.params["id"]).toBe("a/b");
});

test("A-04 LITERAL_GANA: /tenants/me matchea literal aunque :id vaya antes", () => {
  const m = matchRoute(RUTAS, "GET", "/tenants/me");
  expect(m?.route.path).toBe("/tenants/me");
  expect(m?.params).toEqual({});
});

test("A-05 SEGMENT_MISMATCH: /tenants/abc NO matchea /tenants/:id/channels", () => {
  expect(matchParametricPath("/tenants/:id/channels", "/tenants/abc")).toBeNull();
  expect(matchRoute(RUTAS, "GET", "/tenants/abc/other")).toBeNull();
});

test("A-06 ROOT_PATH_INTACTO: GET / sigue funcionando", () => {
  expect(matchRoute(RUTAS, "GET", "/")?.route.path).toBe("/");
});

test("A-07 TRAILING_SLASH_OK: /tenants/abc/channels/ matchea", () => {
  expect(matchRoute(RUTAS, "GET", "/tenants/abc/channels/")?.params).toEqual({ id: "abc" });
});

test("A-08 METHOD_MISMATCH: POST /x NO matchea GET /x", () => {
  expect(matchRoute(RUTAS, "POST", "/x")).toBeNull();
  expect(matchRoute(RUTAS, "GET", "/notifications/n1/read")).toBeNull();
});

test("A-09 CASE_SENSITIVE: /Tenants/abc NO matchea /tenants/:id", () => {
  expect(matchRoute(RUTAS, "GET", "/Tenants/abc")).toBeNull();
});

test("A-10 PARAMS_FROZEN: params congelado en match literal y parametrico", () => {
  expect(Object.isFrozen(matchRoute(RUTAS, "GET", "/pay/a/b")?.params)).toBe(true);
  expect(Object.isFrozen(matchRoute(RUTAS, "GET", "/")?.params)).toBe(true);
});

test("A-11 QUERY_STRING: se ignora para el match y no contamina params", () => {
  expect(matchRoute(RUTAS, "GET", "/notifications?unread=1")?.route.path).toBe("/notifications");
  expect(matchRoute(RUTAS, "GET", "/pay/demo/o1?ref=abc")?.params).toEqual({ tenantSlug: "demo", orderId: "o1" });
});

test("A-12 ZERO_THROW: %ZZ malformado y segmento vacio no matchean ni lanzan", () => {
  expect(() => matchRoute(RUTAS, "GET", "/tenants/%ZZ/channels")).not.toThrow();
  expect(matchRoute(RUTAS, "GET", "/tenants/%ZZ/channels")).toBeNull();
  expect(matchRoute(RUTAS, "GET", "/tenants//channels")).toBeNull();
});
