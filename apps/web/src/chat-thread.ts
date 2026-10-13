/**
 * HUB by Raisen — Hilo de chat (FASE 9.3).
 * Burbujas separando emisor (contacto) vs receptor (agente).
 * Composer inteligente con textarea + boton enviar.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { Mensaje } from "./chat-thread-helpers.ts";
import { formatoHora, esDelContacto } from "./chat-thread-helpers.ts";
import { t, type Idioma } from "./i18n.ts";

function burbuja(m: Mensaje, lang: Idioma): string {
  const delContacto = esDelContacto(m);
  const lado = delContacto ? "ml-auto" : "mr-auto";
  const color = delContacto ? "chat-bubble contact" : "chat-bubble agent";
  const tiempo = `<span class="chat-time">${formatoHora(m.createdAt, lang)}</span>`;
  return `<div class="chat-row ${lado}">
    <div class="${color}">${m.content}</div>
    ${tiempo}
  </div>`;
}

function burbujas(lista: readonly Mensaje[], lang: Idioma): string {
  return lista.map((m) => burbuja(m, lang)).join("");
}

function estadoVacio(lang: Idioma): string {
  return `<div class="chat-empty p-md text-sm text-muted text-center">
    ${t(lang, "chat.empty")}
  </div>`;
}

function composer(lang: Idioma, conversationId: string, uid: string): string {
  return `<div class="chat-composer" data-conversation-id="${conversationId}" data-uid="${uid}">
    <textarea class="chat-input" rows="1" placeholder="${t(lang, "chat.placeholder")}" data-chat-input></textarea>
    <button class="chat-send tap" data-chat-send aria-label="${t(lang, "chat.send")}">
      ${lucide("send", { size: 20 })}
    </button>
  </div>`;
}

export function renderChatThread(
  mensajes: readonly Mensaje[],
  lang: Idioma,
  conversationId: string,
  uid: string,
): string {
  const cuerpo = mensajes.length === 0
    ? estadoVacio(lang)
    : burbujas(mensajes, lang);
  return `<div class="chat-thread">
    <div class="chat-messages" data-chat-messages>${cuerpo}</div>
    ${composer(lang, conversationId, uid)}
  </div>`;
}

export function renderChatCargando(lang: Idioma): string {
  return `<div class="chat-thread">
    <div class="p-md text-sm text-muted text-center">${t(lang, "chat.loading")}</div>
  </div>`;
}