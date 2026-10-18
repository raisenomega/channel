/**
 * HUB by Raisen — W (same-tab): useOauthReturn maneja el retorno del OAuth por query param
 * /channels?oauth=<status> (sin popup/BroadcastChannel). needs_page -> abre picker; connected ->
 * refetch; limpia el param (history.replaceState) para no re-disparar. A-W-1..3.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOauthReturn } from "@/routes/channels-ui/use-oauth-return";

function setSearch(s: string): void { window.history.replaceState({}, "", "/channels" + s); }
beforeEach(() => setSearch(""));

describe("useOauthReturn (same-tab OAuth return)", () => {
  it("A-W-1: ?oauth=needs_page -> abre el picker (setNeedsPage true) y limpia el query param", () => {
    setSearch("?oauth=needs_page&platform=facebook");
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    expect(setNeeds).toHaveBeenCalledWith(true);
    expect(refetch).not.toHaveBeenCalled();
    expect(window.location.search).toBe(""); // param limpiado (no re-dispara)
  });

  it("A-W-2: ?oauth=connected -> refetch (el verde real) y limpia", () => {
    setSearch("?oauth=connected");
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    expect(refetch).toHaveBeenCalled();
    expect(setNeeds).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("A-W-3: sin ?oauth -> no hace nada", () => {
    setSearch("");
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    expect(refetch).not.toHaveBeenCalled();
    expect(setNeeds).not.toHaveBeenCalled();
  });
});
