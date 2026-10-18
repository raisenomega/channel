/**
 * HUB by Raisen — R-6 (Compuerta #70) adversariales del empty-state honesto del phone-shell.
 * A-R-6-1: muestra el mensaje transparente de limitacion Meta. A-R-6-2: boton de import oculto
 * con el flag OFF (default) y visible con ON. A-R-6-3 (UI): WaHome muestra el empty-state solo
 * cuando no hay chats; al llegar chats, el empty-state desaparece (la ENTREGA en vivo = Hotfix P).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhoneShellEmptyState } from "@/components/dashboard/whatsapp/phone-shell-empty-state";
import { WaHome } from "@/components/dashboard/whatsapp/wa-home";
import type { WaChat } from "@/components/dashboard/whatsapp/wa-types";

const noop = () => {};

describe("PhoneShellEmptyState (R-6-1/R-6-2)", () => {
  it("A-R-6-1: renderiza el mensaje transparente de limitacion Meta", () => {
    render(<PhoneShellEmptyState />);
    expect(screen.getByText(/limitación de WhatsApp Business API \(Meta\)/)).toBeTruthy();
    expect(screen.getByText(/en tiempo real/)).toBeTruthy();
  });

  it("A-R-6-2: flag OFF (default) -> boton 'Importar' oculto; ON -> visible", () => {
    const { unmount } = render(<PhoneShellEmptyState importEnabled={false} />);
    expect(screen.queryByText("Importar historial manual (.txt)")).toBeNull();
    unmount();
    render(<PhoneShellEmptyState importEnabled />);
    expect(screen.getByRole("button", { name: /Importar historial manual/ })).toBeTruthy();
  });
});

describe("WaHome empty-state (R-6-3 UI)", () => {
  const chat: WaChat = { id: "c1", name: "Cliente", preview: "hola", time: "10:00", unread: 0, color: "#25D366" };
  it("A-R-6-3a: sin chats -> muestra el empty-state honesto", () => {
    render(<WaHome chats={[]} tab="chats" onTab={noop} onSelect={noop} />);
    expect(screen.getByTestId("phone-shell-empty")).toBeTruthy();
  });
  it("A-R-6-3b: con chats -> el empty-state desaparece (lista de chats)", () => {
    render(<WaHome chats={[chat]} tab="chats" onTab={noop} onSelect={noop} />);
    expect(screen.queryByTestId("phone-shell-empty")).toBeNull();
  });
});
