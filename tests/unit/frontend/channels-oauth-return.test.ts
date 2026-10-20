/**
 * HUB by Raisen — W + Z-4: useOauthReturn. SELF-HEAL: en cada visita a /channels reconcilia
 * channel_connections con Zernio (reconciliarCanales) y hace refetch -> el chip sostiene la verdad
 * aunque el redirect del callback no haya persistido. needs_page -> abre picker; limpia el param.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { reconciliar } = vi.hoisted(() => ({ reconciliar: vi.fn(async () => {}) }));
vi.mock("@/lib/channels-client", () => ({ reconciliarCanales: reconciliar }));
import { useOauthReturn } from "@/routes/channels-ui/use-oauth-return";

function setSearch(s: string): void { window.history.replaceState({}, "", "/channels" + s); }
beforeEach(() => { setSearch(""); reconciliar.mockClear(); });

describe("useOauthReturn (self-heal + same-tab OAuth return)", () => {
  it("self-heal: en cada visita reconcilia con Zernio y hace refetch (sin picker)", async () => {
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    expect(reconciliar).toHaveBeenCalled();
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(setNeeds).not.toHaveBeenCalled();
  });

  it("A-W-1: ?oauth=needs_page -> abre el picker (setNeeds true) + limpia el param (self-heal igual corre)", async () => {
    setSearch("?oauth=needs_page&platform=facebook");
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    expect(setNeeds).toHaveBeenCalledWith(true);
    expect(window.location.search).toBe("");
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it("A-W-2: ?oauth=connected -> reconcile + refetch (el verde real) y limpia", async () => {
    setSearch("?oauth=connected");
    const refetch = vi.fn(); const setNeeds = vi.fn();
    renderHook(() => useOauthReturn(refetch, setNeeds));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(setNeeds).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });
});
