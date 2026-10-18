/**
 * HUB by Raisen — S-2/S-3/S-7/S-8/S-9 adversariales del overlay fullscreen de onboarding.
 * A-S-2: 6 campos barra + 3 cards + 1 boton. A-S-3: email readonly. A-S-7: 1 submit. A-S-8: cancel
 * cierra. A-S-9: solo nombre obligatorio + texto recomendación visible. Mocks de los clientes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { createTenant, actualizarPerfilTenant } = vi.hoisted(() => ({
  createTenant: vi.fn(async () => ({ id: "t1", name: "Raisen.dev" })),
  actualizarPerfilTenant: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/lib/tenant-client/create-tenant", () => ({ createTenant }));
vi.mock("@/lib/tenant-client/update-tenant", () => ({ actualizarPerfilTenant }));

import { OnboardingOverlay } from "@/components/dashboard/registro/onboarding-overlay";

function renderCreate(over: Partial<Parameters<typeof OnboardingOverlay>[0]> = {}) {
  const onClose = vi.fn(); const onDone = vi.fn();
  render(<OnboardingOverlay language="es" mode="create" email="owner@raisen.dev" plan="esencial" onClose={onClose} onDone={onDone} {...over} />);
  return { onClose, onDone };
}
beforeEach(() => { createTenant.mockClear(); actualizarPerfilTenant.mockClear(); });

describe("OnboardingOverlay (S-2/3/7/8/9)", () => {
  it("A-S-2-1: renderiza barra (name/email/phone) + 3 cards + 1 boton submit", () => {
    renderCreate();
    for (const id of ["onb-name", "onb-email", "onb-phone", "onb-card-fisicos", "onb-card-fiscales", "onb-card-brand", "onb-submit"]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("A-S-2-4: chip de plan readonly 'Plan activo: esencial'", () => {
    renderCreate();
    expect(screen.getByTestId("onb-plan").textContent).toContain("esencial");
  });

  it("A-S-3: el campo email es readonly y trae el email del auth", () => {
    renderCreate();
    const email = screen.getByTestId("onb-email") as HTMLInputElement;
    expect(email.value).toBe("owner@raisen.dev");
    expect(email.readOnly).toBe(true);
  });

  it("A-S-9-3: el texto de recomendación amigable es visible", () => {
    renderCreate();
    expect(screen.getByTestId("onb-recommend").textContent).toMatch(/mejor trabajará tu asistente IA/);
  });

  it("A-S-9-2: submit con nombre vacío -> error, NO llama createTenant", async () => {
    renderCreate();
    fireEvent.click(screen.getByTestId("onb-submit"));
    await waitFor(() => expect(screen.getByTestId("onb-error")).toBeTruthy());
    expect(createTenant).not.toHaveBeenCalled();
  });

  it("A-S-9-1: submit solo con nombre -> 201 (createTenant con name + email), onDone", async () => {
    const { onDone } = renderCreate();
    fireEvent.change(screen.getByTestId("onb-name"), { target: { value: "Raisen.dev" } });
    fireEvent.click(screen.getByTestId("onb-submit"));
    await waitFor(() => expect(createTenant).toHaveBeenCalledTimes(1));
    expect(createTenant.mock.calls[0][0]).toMatchObject({ name: "Raisen.dev", email: "owner@raisen.dev" });
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("A-S-8-2: click Cancelar -> onClose (cierra sin guardar)", () => {
    const { onClose } = renderCreate();
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
    expect(createTenant).not.toHaveBeenCalled();
  });

  it("A-S-7/A-S-5-2: submit con brand voice -> createTenant recibe brand_tone='casual'", async () => {
    renderCreate();
    fireEvent.change(screen.getByTestId("onb-name"), { target: { value: "Zafacones" } });
    fireEvent.change(screen.getByTestId("onb-card-brand").querySelector("select")!, { target: { value: "casual" } });
    fireEvent.click(screen.getByTestId("onb-submit"));
    await waitFor(() => expect(createTenant).toHaveBeenCalledTimes(1));
    expect(createTenant.mock.calls[0][0]).toMatchObject({ brand_tone: "casual" });
  });
});
