/**
 * HUB by Raisen — U (Compuerta #120): la ruta frontend /channels/zernio/callback existe (no 404)
 * y REENVIA el callback al handler backend (origen distinto) preservando el query. A-U-1-1/1-3:
 * reenvia con params intactos. A-U-2-1: sin `st` -> error + CTA (no reenvia). Guard anti-loop:
 * si el backend es el mismo origen, no reenvia (error honesto).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getHubApiUrl } = vi.hoisted(() => ({ getHubApiUrl: vi.fn(() => "https://api.hub.test") }));
vi.mock("@/lib/supabase/config", () => ({ getHubApiUrl }));
import { ZernioCallbackForward } from "@/routes/channels.zernio.callback";

const replaceSpy = vi.fn();
function setLocation(search: string, origin = "https://app.hub.test") {
  Object.defineProperty(window, "location", { configurable: true, value: { search, origin, replace: replaceSpy } });
}
beforeEach(() => { replaceSpy.mockClear(); getHubApiUrl.mockReturnValue("https://api.hub.test"); });
afterEach(() => vi.clearAllMocks());

describe("ZernioCallbackForward (Hotfix U)", () => {
  it("A-U-1-1/1-3: con `st` + step -> NO 404 (loading) y reenvia al backend con el query intacto", () => {
    setLocation("?st=ABC123&step=select_page&platform=facebook");
    render(<ZernioCallbackForward />);
    expect(screen.getByTestId("zernio-callback-loading")).toBeTruthy();
    expect(replaceSpy).toHaveBeenCalledWith("https://api.hub.test/channels/zernio/callback?st=ABC123&step=select_page&platform=facebook");
  });

  it("A-U-2-1: sin `st` -> error claro + CTA, NO reenvia", () => {
    setLocation("?platform=facebook");
    render(<ZernioCallbackForward />);
    expect(screen.getByTestId("zernio-callback-error")).toBeTruthy();
    expect(screen.getByText("Volver a Canales")).toBeTruthy();
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("anti-loop: backend mismo origen que el SPA -> NO reenvia (evita loop infinito)", () => {
    getHubApiUrl.mockReturnValue("https://app.hub.test");
    setLocation("?st=ABC123", "https://app.hub.test");
    render(<ZernioCallbackForward />);
    expect(screen.getByTestId("zernio-callback-error")).toBeTruthy();
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
