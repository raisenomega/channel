/**
 * HUB by Raisen — M-12 (A-M-12): alta de contacto es wizard 2-pasos con chips
 * SEGMENTO (vip/regular/nuevo/empresa), NO plan. Paso 1 -> Siguiente -> Paso 2 confirmar.
 */
import { expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateModal } from "@/routes/contacts-ui/create-modal";

function noop() { /* */ }

function renderModal(over: Partial<Record<string, unknown>> = {}) {
  return render(
    <CreateModal
      language="es"
      formName={(over.formName as string) ?? "Juan Perez"} setFormName={noop}
      formPhone={(over.formPhone as string) ?? ""} setFormPhone={noop}
      formEmail="" setFormEmail={noop}
      formSegment="vip" setFormSegment={noop}
      onSave={over.onSave as () => void ?? noop} onClose={noop}
    />,
  );
}

test("A-M-12 Paso 1 muestra chips SEGMENTO (vip/regular/nuevo/empresa), NO plan", () => {
  renderModal();
  expect(screen.getByText("Datos del contacto (1/2)")).toBeDefined();
  expect(screen.getByText("VIP")).toBeDefined();
  expect(screen.getByText("Regular")).toBeDefined();
  // No chips de plan del wizard de tenant:
  expect(screen.queryByText("Lite Starter")).toBeNull();
  expect(screen.queryByText("Ecosystem")).toBeNull();
});

test("A-M-12 Siguiente -> Paso 2 confirmar -> Crear dispara onSave", () => {
  const onSave = vi.fn();
  renderModal({ onSave });
  fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
  expect(screen.getByText("Confirmar contacto (2/2)")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(onSave).toHaveBeenCalledTimes(1);
});
