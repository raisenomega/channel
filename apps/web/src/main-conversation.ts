/**
 * HUB by Raisen — Apertura de una conversación (ficha 360 + hilo) en el shell.
 */
import type { HUBApp } from "./app.ts";
import { auth } from "./auth-client.ts";
import { cargarContacto } from "./contact-client.ts";
import { renderContact360, renderCargando360 } from "./contact-360.ts";
import { cargarMensajes } from "./message-client.ts";
import { renderChatThread, renderChatCargando } from "./chat-thread.ts";
import { getIdioma } from "./interfaz.ts";
import { t } from "./i18n.ts";
import { cablearComposer } from "./main-composer.ts";

function ti(idioma: "es" | "en", key: string): string {
  return t(idioma, key);
}

export function instalarOpenConversation(app: HUBApp): void {
  (globalThis as Record<string, unknown>).openConversation = (conversationId: string) => {
    const panel360 = document.querySelector<HTMLElement>("[data-contact360]");
    const panelChat = document.querySelector<HTMLElement>("[data-chat-thread]");
    if (!panel360 || !panelChat) return;
    const lang = getIdioma();
    panel360.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${ti(lang, "dash.ficha")}</div>` + renderCargando360(lang);
    panelChat.innerHTML = renderChatCargando(lang);
    const contactId = app.contactIdDeConversacion(conversationId);
    if (contactId) {
      void cargarContacto(contactId).then((res) => {
        const idioma = getIdioma();
        const cabecera = `<div class="section text-sm font-bold text-muted px-sm">${ti(idioma, "dash.ficha")}</div>`;
        if (!res.ok) {
          panel360.innerHTML = cabecera + `<div class="p-md text-sm text-muted">${ti(idioma, "dash.fichaSinDatos")}</div>`;
          return;
        }
        panel360.innerHTML = cabecera + renderContact360(res.value, idioma);
      });
    } else {
      panel360.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${ti(lang, "dash.ficha")}</div><div class="p-md text-sm text-muted">${ti(lang, "dash.fichaSinDatos")}</div>`;
    }
    void cargarMensajes(conversationId).then((res) => {
      const idioma = getIdioma();
      if (!res.ok) {
        panelChat.innerHTML = `<div class="p-md text-sm text-muted">${ti(idioma, "chat.empty")}</div>`;
        return;
      }
      const uid = auth.leer()?.uid ?? "";
      panelChat.innerHTML = renderChatThread(res.value, idioma, conversationId, uid);
      cablearComposer(conversationId, uid, panelChat);
    });
  };
  (globalThis as Record<string, unknown>).openConversationOld = undefined;
}