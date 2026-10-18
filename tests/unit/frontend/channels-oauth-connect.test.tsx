/**
 * HUB by Raisen — O-2 + W (same-tab) adversarial A-O-2: el CTA Conectar navega la MISMA pestaña a
 * auth_url (window.location.href, NO popup — un popup tras await lo bloquea el navegador, sobre todo
 * en movil). NUNCA afirma "conectado" (P1). A-O-2b: error del connect-url -> NO navega + muestra error.
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/channels-client", () => ({ obtenerConnectUrl: vi.fn() }));
import { obtenerConnectUrl } from "@/lib/channels-client";
import { ConnectCta } from "@/routes/channels-ui/connect-cta";

let href = "";
const realLocation = window.location;
beforeEach(() => {
  vi.clearAllMocks(); href = "";
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { get href() { return href; }, set href(v: string) { href = v; } },
  });
});
afterEach(() => { Object.defineProperty(window, "location", { configurable: true, value: realLocation }); });

test("A-O-2 click Conectar -> navega la misma pestaña a auth_url (sin popup) + no afirma conectado", async () => {
  (obtenerConnectUrl as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ ok: true, value: "https://zernio.test/auth?x=1" });
  const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  render(<ConnectCta language="es" kind="whatsapp" />);
  fireEvent.click(screen.getByRole("button", { name: "Conectar" }));
  await waitFor(() => expect(href).toBe("https://zernio.test/auth?x=1"));
  expect(openSpy).not.toHaveBeenCalled(); // same-tab, NO popup (popup tras await se bloquea en movil)
  expect(screen.queryByText(/Conectado/)).toBeNull();
  openSpy.mockRestore();
});

test("A-O-2b error del connect-url -> muestra error, NO navega", async () => {
  (obtenerConnectUrl as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ ok: false, error: { kind: "no_autorizado" } });
  render(<ConnectCta language="es" kind="whatsapp" />);
  fireEvent.click(screen.getByRole("button", { name: "Conectar" }));
  await waitFor(() => expect(screen.getByText("No se pudo iniciar la conexión")).toBeDefined());
  expect(href).toBe("");
});
