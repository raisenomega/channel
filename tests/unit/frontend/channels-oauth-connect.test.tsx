/**
 * HUB by Raisen — O-2 adversarial A-O-2: el CTA Conectar abre el popup con el auth_url
 * y marca awaitingVerify, pero NUNCA afirma "conectado" (P1 honestidad).
 */
import { expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/channels-client", () => ({ obtenerConnectUrl: vi.fn() }));
import { obtenerConnectUrl } from "@/lib/channels-client";
import { ConnectCta } from "@/routes/channels-ui/connect-cta";

beforeEach(() => vi.clearAllMocks());

test("A-O-2 click Conectar -> window.open con auth_url + awaitingVerify (no afirma conectado)", async () => {
  (obtenerConnectUrl as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ ok: true, value: "https://zernio.test/auth?x=1" });
  const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  render(<ConnectCta language="es" kind="whatsapp" />);
  fireEvent.click(screen.getByRole("button", { name: "Conectar" }));
  await waitFor(() => expect(openSpy).toHaveBeenCalled());
  expect(openSpy.mock.calls[0]?.[0]).toBe("https://zernio.test/auth?x=1");
  expect(screen.getByRole("button", { name: /Esperando/ })).toBeDefined();
  // P1: en ningun momento el texto dice "Conectado".
  expect(screen.queryByText(/Conectado/)).toBeNull();
  openSpy.mockRestore();
});

test("A-O-2b error del connect-url -> muestra error, NO abre popup", async () => {
  (obtenerConnectUrl as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ ok: false, error: { kind: "no_autorizado" } });
  const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  render(<ConnectCta language="es" kind="whatsapp" />);
  fireEvent.click(screen.getByRole("button", { name: "Conectar" }));
  await waitFor(() => expect(screen.getByText("No se pudo iniciar la conexión")).toBeDefined());
  expect(openSpy).not.toHaveBeenCalled();
  openSpy.mockRestore();
});
