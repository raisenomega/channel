/**
 * HUB by Raisen — Overlay de onboarding (Z-2 + S-2/3/7/8). Full-width, header con logo + nombre,
 * [X] cerrar, email readonly precargado, submit habilitado solo con los 4 campos obligatorios
 * (nombre + email + teléfono E.164 + país). Mocks de los clientes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { createTenant, actualizarPerfilTenant } = vi.hoisted(() => ({
  createTenant: vi.fn(async () => ({ id: "t1", name: "Raisen.dev" })),
  actualizarPerfilTenant: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/lib/tenant-client/create-tenant", () => ({ createTenant }));
vi.mock("@/lib/tenant-client/update-tenant", () => ({ actualizarPerfilTenant }));

import { OnboardingOverlay } from "@/components/dashboard/registro/onboarding-overlay";

function renderCreate(over: Partial<Parameters<typeof OnboardingOverlay>[0]> = {}) {
  const onClose = vi.fn(); const onDone = vi.fn();
  render(<QueryClientProvider client={new QueryClient()}>
    <OnboardingOverlay language="es" mode="create" email="owner@raisen.dev" plan="esencial" onClose={onClose} onDone={onDone} {...over} />
  </QueryClientProvider>);
  return { onClose, onDone };
}
const setPhone = () => fireEvent.change(screen.getByTestId("onb-phone"), { target: { value: "+17875551234" } });
beforeEach(() => { createTenant.mockClear(); actualizarPerfilTenant.mockClear(); });

describe("OnboardingOverlay (Z-2)", () => {
  it("A-S-2-1: barra (name/email/phone) + 3 cards + submit + [X] cerrar", () => {
    renderCreate();
    for (const id of ["onb-name", "onb-email", "onb-phone", "onb-card-fisicos", "onb-card-fiscales", "onb-card-brand", "onb-submit", "onb-close"]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("A-S-2-4: chip de plan readonly 'Plan activo: esencial'", () => {
    renderCreate();
    expect(screen.getByTestId("onb-plan").textContent).toContain("esencial");
  });

  it("A-Z-2-email: email EDITABLE y precargado del auth (ya no readonly)", () => {
    renderCreate();
    const email = screen.getByTestId("onb-email") as HTMLInputElement;
    expect(email.value).toBe("owner@raisen.dev");
    expect(email.readOnly).toBe(false);
    fireEvent.change(email, { target: { value: "contacto@negocio.com" } });
    expect((screen.getByTestId("onb-email") as HTMLInputElement).value).toBe("contacto@negocio.com");
  });

  it("A-S-9-3: el texto de recomendación es visible", () => {
    renderCreate();
    expect(screen.getByTestId("onb-recommend").textContent).toMatch(/mejor trabajará tu asistente IA/);
  });

  it("A-Z-2-val: botón HABILITADO; submit con teléfono inválido -> muestra error y NO crea", async () => {
    renderCreate();
    expect((screen.getByTestId("onb-submit") as HTMLButtonElement).disabled).toBe(false); // ya no bloquea silencioso
    fireEvent.change(screen.getByTestId("onb-name"), { target: { value: "Raisen.dev" } });
    fireEvent.click(screen.getByTestId("onb-submit")); // phone default "+1 787 " no es E.164
    await waitFor(() => expect(screen.getByTestId("onb-error")).toBeTruthy());
    expect(createTenant).not.toHaveBeenCalled();
  });

  it("A-Z-2-submit: con los 4 campos -> createTenant(name + phone + email), onDone", async () => {
    const { onDone } = renderCreate();
    fireEvent.change(screen.getByTestId("onb-name"), { target: { value: "Raisen.dev" } });
    setPhone();
    fireEvent.click(screen.getByTestId("onb-submit"));
    await waitFor(() => expect(createTenant).toHaveBeenCalledTimes(1));
    expect(createTenant.mock.calls[0][0]).toMatchObject({ name: "Raisen.dev", phone: "+17875551234", email: "owner@raisen.dev" });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("A-S-8-2: click Cancelar -> onClose (sin guardar)", () => {
    const { onClose } = renderCreate();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
    expect(createTenant).not.toHaveBeenCalled();
  });

  it("A-Z-2-close: click [X] -> onClose", () => {
    const { onClose } = renderCreate();
    fireEvent.click(screen.getByTestId("onb-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("A-S-5-2: submit con brand voice -> createTenant recibe brand_tone='casual'", async () => {
    renderCreate();
    fireEvent.change(screen.getByTestId("onb-name"), { target: { value: "Zafacones" } });
    setPhone();
    fireEvent.change(screen.getByTestId("onb-card-brand").querySelector("select")!, { target: { value: "casual" } });
    fireEvent.click(screen.getByTestId("onb-submit"));
    await waitFor(() => expect(createTenant).toHaveBeenCalledTimes(1));
    expect(createTenant.mock.calls[0][0]).toMatchObject({ brand_tone: "casual" });
  });
});
