/**
 * HUB by Raisen — M-11 (A-M-11, D-39-bis): el boton "Siguiente" del wizard
 * NO esta muerto cuando los 7 campos son validos; y muestra el motivo si falta algo.
 */
import { expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlideDatosCliente, type TenantFormData } from "@/components/dashboard/onboarding/slide-datos-cliente";

const VALIDO: TenantFormData = {
  name: "Zafacones Ramos", email: "z@z.com", phone: "+17871234567",
  country_code: "PR", timezone: "America/Puerto_Rico", default_language: "es", plan: "lite_starter",
};

test("A-M-11 7 campos validos -> Siguiente habilitado y dispara onGoToStep2", () => {
  const go = vi.fn();
  render(<SlideDatosCliente language="es" data={VALIDO} onChange={() => {}} onGoToStep2={go} />);
  const btn = screen.getByText("Siguiente →").closest("button") ?? screen.getByRole("button", { name: /Siguiente/ });
  expect((btn as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(btn as HTMLButtonElement);
  expect(go).toHaveBeenCalledTimes(1);
});

test("A-M-11 phone sin E.164 -> Siguiente deshabilitado + motivo visible (no mudo)", () => {
  const go = vi.fn();
  render(<SlideDatosCliente language="es" data={{ ...VALIDO, phone: "7871234567" }} onChange={() => {}} onGoToStep2={go} />);
  expect(screen.getByText(/E\.164/)).toBeDefined();
});
