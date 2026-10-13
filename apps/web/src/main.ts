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
import { t } from "./i18n.ts";
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
  (globalThis as Record<string, unknown>).openConversation = (conversationId: string) => {
    const panel = document.querySelector<HTMLElement>("[data-contact360]");
    if (!panel) return;
    const lang = leerIdiomaActual();
    panel.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(lang, "dash.ficha")}</div>` + cargarCargando(lang);
    const contactId = app.contactIdDeConversacion(conversationId);
    if (!contactId) {
      panel.innerHTML = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(lang, "dash.ficha")}</div><div class="p-md text-sm text-muted">${tPlano(lang, "dash.fichaSinDatos")}</div>`;
      return;
    }
    void cargarContacto(contactId).then((res) => {
      const idioma = leerIdiomaActual();
      const cabecera = `<div class="section text-sm font-bold text-muted px-sm">${tPlano(idioma, "dash.ficha")}</div>`;
      if (!res.ok) {
        panel.innerHTML = cabecera + `<div class="p-md text-sm text-muted">${tPlano(idioma, "dash.fichaSinDatos")}</div>`;
        return;
      }
      panel.innerHTML = cabecera + renderContact360(res.value, idioma);
    });
  };
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

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) void inicializarHUB(el as HTMLElement);
}