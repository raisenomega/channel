/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Flujo: login -> resolver tenant -> (si falta) onboarding -> shell.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";
import { logger } from "@shared/infrastructure/logger.infrastructure.ts";
import { iniciarVigia } from "./vigia.ts";
import { iniciarControlesShell, suscribirAlCambio, toggleTema, getIdioma } from "./interfaz.ts";
import { auth, SessionUsuario } from "./auth-client.ts";
import { resolverTenant } from "./tenant-client.ts";
import { cargarInbox } from "./inbox-client.ts";
import { crearTenant } from "./onboarding-client.ts";
import { montarLogin } from "./login-view.ts";
import { montarOnboarding } from "./onboarding-view.ts";
import { cargarContacto } from "./contact-client.ts";
import { renderContact360, renderCargando360 } from "./contact-360.ts";
import { cargarMensajes, enviarMensaje } from "./message-client.ts";
import { renderChatThread, renderChatCargando } from "./chat-thread.ts";
import { t } from "./i18n.ts";
import { conectarHandlersCanales } from "./channel-handlers.ts";
import type { AppContext, TabId } from "./types.ts";

interface HubConfigGlobal {
  __HUB_CONFIG__?: { supabaseUrl: string; anonKey: string };
}

const FASE = "FASE_F";

// Referencias al contexto para re-renderizar al cambiar idioma/tema.
let raizActual: HTMLElement | null = null;
let appActual: HUBApp | null = null;

export async function inicializarHUB(root: HTMLElement): Promise<void> {
  iniciarVigia(FASE);
  iniciarControlesShell();
  suscribirAlCambio(() => {
    if (raizActual && appActual) renderVista(raizActual, appActual);
  });
  const config = (globalThis as HubConfigGlobal).__HUB_CONFIG__;
  const sesion = config?.supabaseUrl ? auth.leer() : null;
  if (!sesion) {
    logger.info("sin_sesion_guardada", { fase: FASE });
    montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
    return;
  }
  await montarShellAutenticado(root, sesion);
}

async function montarShellAutenticado(root: HTMLElement, sesionPrevia?: SessionUsuario): Promise<void> {
  const sesion = sesionPrevia ?? auth.leer();
  if (!sesion) {
    montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
    return;
  }
  const tenResult = await resolverTenant(sesion);
  logger.info("tenant_resuelto", { fase: FASE, uid: sesion.uid, tenantId: tenResult.ok ? tenResult.value.tenantId : undefined });
  if (!tenResult.ok) {
    logger.warn("tenant_no_encontrado", { fase: FASE, uid: sesion.uid, causa: tenResult.error.kind });
    // Token invalido (caducado o usuario borrado): cerrar sesion y volver al login.
    if (tenResult.error.kind === "no_autorizado") {
      await auth.cerrar();
      montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
      return;
    }
    // Sin tenant: el registro completo -> onboarding para crearlo.
    montarOnboarding(root, async (datos) => {
      const res = await crearTenant(sesion, datos);
      if (!res.ok) {
        logger.error("onboarding_fallo", { fase: FASE, uid: sesion.uid, causa: causaDe(res.error) });
        return mensajeOnboarding(res.error.kind, res.error.kind === "validacion" ? causaDe(res.error) : undefined);
      }
      logger.info("tenant_creado", { fase: FASE, uid: sesion.uid, tenantId: res.value });
      auth.guardar({ ...sesion, tenant: { tenantId: res.value, name: datos.tenantName, plan: datos.plan, slug: datos.slug } });
      await montarShellAutenticado(root, sessionConTenant(sesion, res.value, datos));
      return null;
    }, async () => {
      await auth.cerrar();
      montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
    });
    return;
  }
  const t = tenResult.value;
  const contexto: AppContext = Object.freeze({
    uid: sesion.uid,
    email: sesion.email,
    tenantId: t.tenantId,
    tenantName: t.name,
    tenantPlan: t.plan,
  });
  const app = new HUBApp(contexto, async () => {
    const res = await cargarInbox(sesion);
    return res.ok ? res.value : [];
  });
  await app.iniciar();
  appActual = app;
  raizActual = root;
  renderVista(root, app);
}

function sessionConTenant(
  base: SessionUsuario,
  tenantId: string,
  datos: { tenantName: string; plan: string; slug: string },
): SessionUsuario {
  return Object.freeze({
    ...base,
    tenant: { tenantId, name: datos.tenantName, plan: datos.plan, slug: datos.slug },
  });
}

function mensajeOnboarding(kind: string, cause?: string): string | null {
  if (kind === "no_autorizado") return "Sesion invalida. Vuelve a iniciar sesion.";
  if (kind === "validacion") return cause ?? "No se pudo crear el espacio. Verifica el identificador.";
  if (kind === "red") return cause ?? "Error de conexion. Intenta de nuevo.";
  return null;
}

// Extrae la causa de un error de onboarding cuando el kind la expone.
function causaDe(e: { readonly kind: string; readonly cause?: string }): string | undefined {
  return e.cause;
}

// Pinta la vista actual en el area #app y conecta la navegacion del shell.
function renderVista(root: HTMLElement, app: HUBApp): void {
  root.innerHTML = app.renderCurrentTab();
  cablearNavegacion(root, app);
  // Dispatcher global para botones renderizados dentro de #app.
  (globalThis as Record<string, unknown>).handleAction = (
    action: string,
    params?: Record<string, unknown>,
  ) => {
    app.handleAction(action, params);
    appActual = app;
    raizActual = root;
    root.innerHTML = app.renderCurrentTab();
    sincronizarNav(app);
    cablearNavegacion(root, app);
  };
  const themeSwitch = document.querySelector<HTMLButtonElement>("[data-settings-theme]");
  themeSwitch?.addEventListener("click", () => {
    toggleTema();
  });
  // Handlers globales para acciones renderizadas en #app (no lanzan error).
  (globalThis as Record<string, unknown>).toggleFilter = (_tipo: string, valor: string) => {
    app.toggleFiltroCanal(valor);
    appActual = app;
    raizActual = root;
    root.innerHTML = app.renderCurrentTab();
    cablearNavegacion(root, app);
  };
  // Canales (FASE 9.5-9.7): acciones de conectar/desconectar, autonomia y BYOK.
  // Se vincula siempre para que `actuarCanal` siga activo en cualquier navegacion.
  conectarHandlersCanales(() => {
    if (raizActual && appActual) {
      raizActual.innerHTML = appActual.renderCurrentTab();
      cablearNavegacion(raizActual, appActual);
    }
  });
  const sesion = auth.leer();
  (globalThis as Record<string, unknown>).openConversation = (conversationId: string) => {
    const panel360 = document.querySelector<HTMLElement>("[data-contact360]");
    const panelChat = document.querySelector<HTMLElement>("[data-chat-thread]");
    if (!panel360 || !panelChat) return;
    const lang = leerIdiomaActual();
    // Cargar ficha 360 (existente).
    panel360.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(lang, "dash.ficha")}</div>` + cargarCargando(lang);
    // Cargar hilo de chat (nuevo).
    panelChat.innerHTML = renderChatCargando(lang);
    const contactId = app.contactIdDeConversacion(conversationId);
    if (contactId) {
      void cargarContacto(contactId).then((res) => {
        const idioma = leerIdiomaActual();
        const cabecera = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(idioma, "dash.ficha")}</div>`;
        if (!res.ok) {
          panel360.innerHTML = cabecera + `<div class="p-md text-sm text-muted">${tPlano(idioma, "dash.fichaSinDatos")}</div>`;
          return;
        }
        panel360.innerHTML = cabecera + renderContact360(res.value, idioma);
      });
    } else {
      panel360.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(lang, "dash.ficha")}</div><div class="p-md text-sm text-muted">${tPlano(lang, "dash.fichaSinDatos")}</div>`;
    }
    // Cargar mensajes reales.
    void cargarMensajes(conversationId).then((res) => {
      const idioma = leerIdiomaActual();
      if (!res.ok) {
        panelChat.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(idioma, "dash.conversaciones")}</div><div class="p-md text-sm text-muted">${tPlano(idioma, "chat.empty")}</div>`;
        return;
      }
      const uid = sesion?.uid ?? "";
      panelChat.innerHTML = renderChatThread(res.value, idioma, conversationId, uid);
      cablearComposer(conversationId, sesion?.uid ?? "", panelChat);
    });
  };
  (globalThis as Record<string, unknown>).openConversationOld = undefined;
}

function leerIdiomaActual(): "es" | "en" {
  return getIdioma();
}

function tPlano(idioma: "es" | "en", key: string): string {
  return t(idioma, key);
}

function cargarCargando(idioma: "es" | "en"): string {
  return renderCargando360(idioma);
}

function sincronizarNav(app: HUBApp): void {
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  const actual = app.currentTab();
  tabButtons.forEach((b) => {
    b.setAttribute("aria-selected", b.dataset.tab === actual ? "true" : "false");
  });
}

function cablearNavegacion(root: HTMLElement, app: HUBApp): void {
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
  tabButtons.forEach((btn) => {
    btn.onclick = () => {
      const tab = btn.dataset.tab as TabId;
      app.handleAction("navigate", { tab });
      tabButtons.forEach((b) => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      root.innerHTML = app.renderCurrentTab();
    };
  });
}

/** Cablea el boton de enviar del composer y el textarea (auto-grow). */
function cablearComposer(
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

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) void inicializarHUB(el as HTMLElement);
}