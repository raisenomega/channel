/**
 * HUB by Raisen — R-2/R-3/R-4 adversariales A-R-1/A-R-2/A-R-9 de RegistroWhatsApp.
 * Sin tenant -> CTA "Registrar WhatsApp" (no wizard). Con tenant -> datos del TENANT + "Registrado"
 * (Compuerta #66: nombre del tenant, no de un contacto).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistroWhatsApp } from "@/components/dashboard/registro/registro-whatsapp";

describe("RegistroWhatsApp (R-2/R-3/R-4)", () => {
  it("A-R-1: user sin tenant -> CTA 'Registrar WhatsApp' (no datos de tenant)", () => {
    render(<RegistroWhatsApp language="es" tenant={null} onDone={() => {}} />);
    expect(screen.getByText("Registrar WhatsApp")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Registrado" })).toBeNull();
  });

  it("A-R-2: user con tenant -> muestra el tenant + 'Registrado' (no CTA registrar)", () => {
    render(<RegistroWhatsApp language="es" tenant={{ id: "t1", name: "Raisen.dev", plan: "esencial" }} onDone={() => {}} />);
    expect(screen.getByText("Raisen.dev")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registrado" })).toBeTruthy();
    expect(screen.queryByText("Registrar WhatsApp")).toBeNull();
  });

  it("A-R-9: la tarjeta muestra tenant.name, no el nombre de un contacto (Compuerta #66)", () => {
    render(<RegistroWhatsApp language="en" tenant={{ id: "t9", name: "Zafacones Ramos", plan: "pro" }} onDone={() => {}} />);
    const card = screen.getByTestId("registro-whatsapp");
    expect(card.textContent).toContain("Zafacones Ramos");
    expect(card.textContent).not.toContain("Register WhatsApp"); // no CTA de alta
  });
});
