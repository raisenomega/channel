/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Flujo: login -> resolver tenant -> (si falta) onboarding -> shell.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";
import { logger } from "@shared/infrastructure/logger.infrastructure.ts";
import { iniciarVigia } from "./vigia.ts";
import { iniciarControlesShell } from "./interfaz.ts";
import { auth, SessionUsuario } from "./auth-client.ts";
import { resolverTenant } from "./tenant-client.ts";
import { cargarInbox } from "./inbox-client.ts";
import { crearTenant } from "./onboarding-client.ts";
import { montarLogin } from "./login-view.ts";
import { montarOnboarding } from "./onboarding-view.ts";
import type { AppContext, TabId } from "./types.ts";

interface HubConfigGlobal {
  __HUB_CONFIG__?: { supabaseUrl: string; anonKey: string };
}

const FASE = "FASE_F";

export async function inicializarHUB(root: HTMLElement): Promise<void> {
  iniciarVigia(FASE);
  iniciarControlesShell();
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