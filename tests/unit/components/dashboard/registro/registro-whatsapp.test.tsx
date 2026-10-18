/**
 * HUB by Raisen — S-10 (Compuertas #98/#101) state machine CTA de RegistroWhatsApp (supersede
 * A-R-1/2/9, preservando #66 = nombre del tenant, no de un contacto). 3 estados: sin tenant /
 * con tenant+0 canales / con tenant+canales. A-S-10-1..5. Mock de useNavigate + readLocalSession.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const navSpy = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navSpy }));
vi.mock("@/lib/auth", () => ({ readLocalSession: () => ({ user: { email: "owner@raisen.dev" } }) }));

import { RegistroWhatsApp } from "@/components/dashboard/registro/registro-whatsapp";

const TENANT = { id: "t1", name: "Raisen.dev", plan: "esencial" };
beforeEach(() => navSpy.mockClear());

describe("RegistroWhatsApp state machine (S-10)", () => {
  it("A-S-10-1: sin tenant -> CTA 'Registrar WhatsApp' (boton 'Registrar')", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(screen.getByText("Registrar WhatsApp")).toBeTruthy();
    expect(screen.getByTestId("registro-cta").textContent).toBe("Registrar");
  });

  it("A-S-10-2/3: tenant + 0 canales -> 'Conectar Canales y Redes' y click navega a /channels", () => {
    render(<RegistroWhatsApp language="es" tenant={TENANT} channelsConectados={0} onDone={() => {}} />);
    const cta = screen.getByTestId("registro-cta");
    expect(cta.textContent).toBe("Conectar Canales y Redes");
    fireEvent.click(cta);
    expect(navSpy).toHaveBeenCalledWith({ to: "/channels" });
  });

  it("A-S-10-4/5: tenant + canales -> 'Editar datos' y click abre el overlay fullscreen", () => {
    render(<RegistroWhatsApp language="es" tenant={TENANT} channelsConectados={2} onDone={() => {}} />);
    const cta = screen.getByTestId("registro-cta");
    expect(cta.textContent).toBe("Editar datos");
    fireEvent.click(cta);
    expect(screen.getByTestId("onboarding-overlay")).toBeTruthy();
  });

  it("A-S-8-1: sin tenant, click 'Registrar' -> abre overlay fullscreen (create)", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    fireEvent.click(screen.getByTestId("registro-cta"));
    expect(screen.getByTestId("onboarding-overlay")).toBeTruthy();
  });

  it("A-R-9 (#66): la tarjeta muestra tenant.name, no CTA de alta ni contacto", () => {
    render(<RegistroWhatsApp language="en" tenant={{ id: "t9", name: "Zafacones Ramos", plan: "pro" }} channelsConectados={1} onDone={() => {}} />);
    const card = screen.getByTestId("registro-whatsapp");
    expect(card.textContent).toContain("Zafacones Ramos");
    expect(card.textContent).not.toContain("Register WhatsApp");
  });
});
