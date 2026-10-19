/**
 * HUB by Raisen — D-51: el shell/apiFetch deben derivar la sesion de onAuthStateChange (reactivo),
 * no de una lectura one-shot de hub.session. Signup DEBE persistir hub.session.
 */
import { expect, test, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";

const fakeSession = { access_token: "jwt-x", user: { id: "u1" } };
let authCb: ((e: string, s: unknown) => void) | null = null;
const fakeClient = {
  auth: {
    onAuthStateChange: (cb: (e: string, s: unknown) => void) => { authCb = cb; return { data: { subscription: { unsubscribe() { /* */ } } } }; },
    signUp: vi.fn(async () => ({ data: { session: fakeSession }, error: null })),
  },
};
vi.mock("@/lib/supabase", () => ({ getSupabase: () => fakeClient }));

import { useSession } from "@/lib/use-session";
import { registerUser } from "@/lib/auth";

beforeEach(() => { localStorage.clear(); authCb = null; });

test("A-D-51 useSession reactivo: onAuthStateChange(session) -> retorna sesion + espeja hub.session", async () => {
  const { result } = renderHook(() => useSession());
  authCb?.("INITIAL_SESSION", fakeSession);   // reload: el SDK restaura la sesion
  await waitFor(() => expect(result.current).not.toBeNull());
  expect((result.current as { access_token: string }).access_token).toBe("jwt-x");
  expect(localStorage.getItem("hub.session")).toContain("jwt-x");
});

test("A-D-51 signup persiste hub.session (nav + apiFetch token)", async () => {
  const r = await registerUser("a@b.co", "pw12345678");
  expect(r.ok).toBe(true);
  expect(localStorage.getItem("hub.session")).toContain("jwt-x");
});

test("A-Z-3: el shell NO gatea el nav por la sesion (chips permanentes por ruta); useSession se mantiene por su efecto lateral (mirror hub.session)", () => {
  const SRC = readFileSync("apps/tanstack/src/components/layout/shell.tsx", "utf8");
  expect(SRC).toContain("useSession()");                      // D-51: efecto lateral (espeja hub.session para apiFetch) intacto
  expect(SRC).not.toContain("readLocalSession() !== null");   // no vuelve a la lectura one-shot vieja
  expect(SRC).not.toMatch(/loggedIn\s*=\s*useSession/);       // Z-3: el nav ya NO depende del estado de sesion (flaky)
  expect(SRC).toContain("showChrome");                        // Z-3: visibilidad del nav por ruta -> chips permanentes
});
