/**
 * HUB by Raisen — O-4 frontend: el page picker lista las paginas y al seleccionar hace POST
 * select-page + notifica onConnected (P1: el verde real lo confirma el refetch, no el modal).
 */
import { expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/channels-client/fb-pages", () => ({
  obtenerPaginasFb: vi.fn(async () => [{ id: "pg-1", name: "Mi Pagina" }]),
  seleccionarPaginaFb: vi.fn(async () => true),
}));
import { seleccionarPaginaFb } from "@/lib/channels-client/fb-pages";
import { FacebookPagePicker } from "@/routes/channels-ui/facebook-page-picker";

beforeEach(() => vi.clearAllMocks());

test("A-O-4 picker lista paginas + seleccionar -> POST select-page + onConnected", async () => {
  const onConnected = vi.fn();
  render(<FacebookPagePicker language="es" onClose={() => {}} onConnected={onConnected} />);
  await waitFor(() => expect(screen.getByRole("button", { name: /Mi Pagina/ })).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: /Mi Pagina/ }));
  await waitFor(() => expect(seleccionarPaginaFb).toHaveBeenCalledWith("pg-1"));
  await waitFor(() => expect(onConnected).toHaveBeenCalled());
});
