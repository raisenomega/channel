/**
 * HUB by Raisen — T-4 (Compuerta #113): recovery del OAuth atascado en "Esperando…". A-T-4-1:
 * si en 60s no llega el 'connected', el CTA muestra "Conexion no completada" + Reintentar.
 * A-T-4-2: Cancelar manual mientras espera vuelve al CTA Conectar y desarma el timeout.
 */
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@/lib/channels-client", () => ({ obtenerConnectUrl: vi.fn() }));
import { obtenerConnectUrl } from "@/lib/channels-client";
import { ConnectCta } from "@/routes/channels-ui/connect-cta";

const mockUrl = () => (obtenerConnectUrl as unknown as { mockResolvedValue: (v: unknown) => void })
  .mockResolvedValue({ ok: true, value: "https://zernio.test/auth?x=1" });

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.spyOn(window, "open").mockImplementation(() => null); });
afterEach(() => vi.useRealTimers());

test("A-T-4-1: OAuth sin resolver 60s -> timeout 'Conexion no completada' + Reintentar re-abre", async () => {
  mockUrl();
  render(<ConnectCta language="es" kind="whatsapp" />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Conectar" })); });
  expect(screen.getByRole("button", { name: /Esperando/ })).toBeTruthy();
  act(() => { vi.advanceTimersByTime(60_000); });
  expect(screen.getByTestId("connect-timeout")).toBeTruthy();
  const retry = screen.getByRole("button", { name: "Reintentar" });
  await act(async () => { fireEvent.click(retry); });
  expect((obtenerConnectUrl as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(2);
  expect(screen.getByRole("button", { name: /Esperando/ })).toBeTruthy();
});

test("A-T-4-2: Cancelar mientras espera -> vuelve a 'Conectar' y NO dispara timeout a los 60s", async () => {
  mockUrl();
  render(<ConnectCta language="es" kind="whatsapp" />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Conectar" })); });
  fireEvent.click(screen.getByTestId("connect-cancel"));
  expect(screen.getByRole("button", { name: "Conectar" })).toBeTruthy();
  act(() => { vi.advanceTimersByTime(60_000); });
  expect(screen.queryByTestId("connect-timeout")).toBeNull();
});
