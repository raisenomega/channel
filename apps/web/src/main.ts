/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Flujo: login -> resolver tenant -> (si falta) onboarding -> shell.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";
import { auth, SessionUsuario } from "./auth-client.ts";
import { resolverTenant } from "./tenant-client.ts";
import { cargarInbox } from "./inbox-client.ts";
import { crearTenant } from "./onboarding-client.ts";
import { montarLogin } from "./login-view.ts";
import { montarOnboarding } from "./onboarding-view.ts";
import type { AppContext } from "./types.ts";

interface HubConfigGlobal {
  __HUB_CONFIG__?: { supabaseUrl: string; anonKey: string };
}

export async function inicializarHUB(root: HTMLElement): Promise<void> {
  const config = (globalThis as HubConfigGlobal).__HUB_CONFIG__;
  const sesion = config?.supabaseUrl ? auth.leer() : null;
  if (!sesion) {
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
  if (!tenResult.ok) {
    // Sin tenant: el registro completo -> onboarding para crearlo.
    montarOnboarding(root, async (datos) => {
      const res = await crearTenant(sesion, datos);
      if (!res.ok) return mensajeOnboarding(res.error.kind, res.error.kind === "validacion" ? res.error.cause : undefined);
      auth.guardar({ ...sesion, tenant: { tenantId: res.value, name: datos.tenantName, plan: datos.plan, slug: datos.slug } });
      await montarShellAutenticado(root, sessionConTenant(sesion, res.value, datos));
      return null;
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
  root.innerHTML = app.renderCurrentTab();
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

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) void inicializarHUB(el as HTMLElement);
}