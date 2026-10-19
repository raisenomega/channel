/**
 * HUB by Raisen — Barra de registro/edición (SOT: docs/DASHBOARD_PANEL_SOT.md). CTA a la derecha:
 * "Crear mi negocio" (sin tenant) / "Editar datos" (con tenant). Sin botón "Conectar Canales" (Z-2).
 * Edición abre el overlay con prefill COMPLETO vía fetchTenantPerfil. Toda la barra es clickeable.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/auth", () => ({ readLocalSession: () => ({ user: { email: "owner@raisen.dev" } }) }));
const { fetchPerfil } = vi.hoisted(() => ({ fetchPerfil: vi.fn(async () => null as Record<string, string> | null) }));
vi.mock("@/lib/tenant-client/tenant-profile", () => ({ fetchTenantPerfil: fetchPerfil }));

import { RegistroWhatsApp } from "@/components/dashboard/registro/registro-whatsapp";

const TENANT = { id: "t1", name: "Raisen.dev", plan: "esencial" };
beforeEach(() => fetchPerfil.mockReset());

describe("RegistroWhatsApp (SOT)", () => {
  it("sin tenant: CTA 'Crear mi negocio' a la derecha, SIN botón Conectar Canales", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(screen.getByTestId("registro-crear").textContent).toBe("Crear mi negocio");
    expect(screen.queryByTestId("registro-connect")).toBeNull();
  });

  it("click en la barra sin tenant -> overlay CREATE", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(screen.queryByTestId("onboarding-overlay")).toBeNull();
    fireEvent.click(screen.getByTestId("registro-whatsapp"));
    expect(screen.getByTestId("onboarding-overlay").textContent).toContain("Registrar tu negocio");
  });

  it("con tenant: CTA 'Editar datos' + click abre overlay EDIT con prefill COMPLETO (fetchTenantPerfil)", async () => {
    fetchPerfil.mockResolvedValueOnce({ name: "Raisen.dev", city: "San Juan" });
    render(<RegistroWhatsApp language="es" tenant={TENANT} onDone={() => {}} />);
    expect(screen.getByTestId("registro-editar").textContent).toBe("Editar datos");
    fireEvent.click(screen.getByTestId("registro-whatsapp"));
    await waitFor(() => expect(screen.getByTestId("onboarding-overlay")).toBeTruthy());
    expect(fetchPerfil).toHaveBeenCalledWith("t1");
    expect((screen.getByTestId("onb-name") as HTMLInputElement).value).toBe("Raisen.dev");
  });

  it("click [X] cierra el overlay y NO reabre (sin burbujeo a la barra)", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    fireEvent.click(screen.getByTestId("registro-whatsapp"));
    expect(screen.getByTestId("onboarding-overlay")).toBeTruthy();
    fireEvent.click(screen.getByTestId("onb-close"));
    expect(screen.queryByTestId("onboarding-overlay")).toBeNull();
  });

  it("muestra tenant.name en la barra", () => {
    render(<RegistroWhatsApp language="en" tenant={{ id: "t9", name: "Zafacones Ramos", plan: "pro" }} onDone={() => {}} />);
    expect(screen.getByTestId("registro-whatsapp").textContent).toContain("Zafacones Ramos");
  });
});
