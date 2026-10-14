/**
 * HUB by Raisen — Cableado del composer de chat (textarea + enviar).
 */
import { enviarMensaje } from "./message-client.ts";

/** Cablea el boton de enviar del composer y el textarea (auto-grow). */
export function cablearComposer(
  conversationId: string,
  uid: string,
  container: HTMLElement,
): void {
  const input = container.querySelector<HTMLTextAreaElement>("[data-chat-input]");
  const sendBtn = container.querySelector<HTMLButtonElement>("[data-chat-send]");
  if (!input || !sendBtn) return;

  const autoGrow = (): void => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  };
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  sendBtn.addEventListener("click", () => {
    const texto = input.value.trim();
    if (!texto) return;
    input.value = "";
    autoGrow();
    void enviarMensaje(conversationId, texto, uid);
  });
}