/**
 * HUB by Raisen — M-10 (A-M-10): logout revoca sesion REAL.
 * signOut({scope:'global'}) + barre TODAS las keys sb-* de localStorage Y sessionStorage.
 * Corre en jsdom (tests/unit/frontend/**).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const signOut = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ auth: { signOut } }) }));

import { logout } from "@/lib/auth";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  signOut.mockClear();
});
afterEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });

test("A-M-10 logout: signOut global + sb-* barridos de ambos storages + hub.session fuera", async () => {
  window.localStorage.setItem("sb-qbpz-auth-token", "tok");
  window.localStorage.setItem("sb-qbpz-auth-token-code-verifier", "v");
  window.localStorage.setItem("hub.session", "s");
  window.sessionStorage.setItem("sb-qbpz-auth-token", "tok2");

  await logout();

  expect(signOut).toHaveBeenCalledWith({ scope: "global" });
  expect(window.localStorage.getItem("sb-qbpz-auth-token")).toBeNull();
  expect(window.localStorage.getItem("sb-qbpz-auth-token-code-verifier")).toBeNull();
  expect(window.localStorage.getItem("hub.session")).toBeNull();
  expect(window.sessionStorage.getItem("sb-qbpz-auth-token")).toBeNull();
});
