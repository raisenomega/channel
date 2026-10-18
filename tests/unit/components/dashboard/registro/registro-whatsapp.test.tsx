/**
 * HUB by Raisen — T-1/T-3 (Compuertas #112/#113): barra unificada clickeable. A-T-1-1: sin boton
 * dorado "Registrar" (el CTA duplicado se elimino). A-T-3-1/2: click en la barra abre overlay
 * (edit con tenant, create sin tenant) en cualquier estado = recovery. A-S-10: "Conectar Canales"
 * sigue como enlace secundario que navega (stopPropagation). #66: nombre del tenant, no contacto.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const navSpy = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navSpy }));
vi.mock("@/lib/auth", () => ({ readLocalSession: () => ({ user: { email: "owner@raisen.dev" } }) }));

import { RegistroWhatsApp } from "@/components/dashboard/registro/registro-whatsapp";

const TENANT = { id: "t1", name: "Raisen.dev", plan: "esencial" };
beforeEach(() => navSpy.mockClear());

describe("RegistroWhatsApp barra unificada (T-1/T-3)", () => {
  it("A-T-1-1: NO existe boton dorado 'Registrar' (bg-primary) en la barra", () => {
    const { container } = render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(container.querySelector("button.bg-primary")).toBeNull();
    expect(screen.queryByRole("button", { name: "Registrar" })).toBeNull();
  });

  it("A-T-3-2: click en la barra sin tenant -> abre overlay CREATE", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(screen.queryByTestId("onboarding-overlay")).toBeNull();
    fireEvent.click(screen.getByTestId("registro-whatsapp"));
    const ov = screen.getByTestId("onboarding-overlay");
    expect(ov.textContent).toContain("Registrar tu negocio");
  });

  it("A-T-3-1: click en la barra con tenant -> abre overlay EDIT (prefill name)", () => {
    render(<RegistroWhatsApp language="es" tenant={TENANT} channelsConectados={2} onDone={() => {}} />);
    fireEvent.click(screen.getByTestId("registro-whatsapp"));
    const ov = screen.getByTestId("onboarding-overlay");
    expect(ov.textContent).toContain("Editar datos del negocio");
    expect((screen.getByTestId("onb-name") as HTMLInputElement).value).toBe("Raisen.dev");
  });

  it("A-S-10: tenant + 0 canales -> enlace 'Conectar Canales y Redes' navega SIN abrir overlay", () => {
    render(<RegistroWhatsApp language="es" tenant={TENANT} channelsConectados={0} onDone={() => {}} />);
    const connect = screen.getByTestId("registro-connect");
    expect(connect.textContent).toBe("Conectar Canales y Redes");
    fireEvent.click(connect);
    expect(navSpy).toHaveBeenCalledWith({ to: "/channels" });
    expect(screen.queryByTestId("onboarding-overlay")).toBeNull();
  });

  it("A-R-9 (#66): muestra tenant.name, no CTA de alta", () => {
    render(<RegistroWhatsApp language="en" tenant={{ id: "t9", name: "Zafacones Ramos", plan: "pro" }} channelsConectados={1} onDone={() => {}} />);
    const card = screen.getByTestId("registro-whatsapp");
    expect(card.textContent).toContain("Zafacones Ramos");
    expect(card.textContent).not.toContain("Register WhatsApp");
  });
});
