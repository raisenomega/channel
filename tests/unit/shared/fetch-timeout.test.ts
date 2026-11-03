/**
 * HUB by Raisen — fetchConTimeout aborta la llamada al vencer el timeout (no deja promesas colgadas) y
 * esAbort reconoce el AbortError para mapearlo a kind 'timeout' (reintentable/degradable).
 */
import { afterEach, expect, test, vi } from "vitest";
import { fetchConTimeout, esAbort } from "../../../src/shared/infrastructure/fetch-timeout.ts";

afterEach(() => { vi.restoreAllMocks(); });

test("FT-01 aborta si la llamada excede el timeout", async () => {
  vi.stubGlobal("fetch", (_u: string, init?: RequestInit) => new Promise<Response>((_res, rej) => {
    init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
  }));
  await expect(fetchConTimeout("http://x", {}, 10)).rejects.toMatchObject({ name: "AbortError" });
});

test("FT-02 no aborta si responde a tiempo", async () => {
  vi.stubGlobal("fetch", async () => new Response("ok"));
  const r = await fetchConTimeout("http://x", {}, 1000);
  expect(await r.text()).toBe("ok");
});

test("FT-03 esAbort reconoce AbortError y nada mas", () => {
  expect(esAbort({ name: "AbortError" })).toBe(true);
  expect(esAbort(new Error("red"))).toBe(false);
  expect(esAbort(null)).toBe(false);
});
