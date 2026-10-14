/**
 * HUB by Raisen — Flujo del bootstrap (login → tenant → onboarding → shell). C4.
 */
import { HUBApp } from "./app.ts";
import { iniciarVigia } from "./vigia.ts";
import { iniciarControlesShell, suscribirAlCambio } from "./interfaz.ts";
import { auth, type SessionUsuario } from "./auth-client.ts";
import { resolverTenant } from "./tenant-client.ts";
import { cargarInbox } from "./inbox-client.ts";
import { montarLogin } from "./login-view.ts";
import { cargarSafe } from "./safe-client.ts";
import type { AppContext } from "./types.ts";
import { registrarVista } from "./main-state.ts";
import { repintarVista } from "./main-nav.ts";
import { renderVista } from "./main-render.ts";
import { manejarOnboarding } from "./bootstrap-onboarding.ts";

const FASE = "FASE_F";
const volverALogin = (root: HTMLElement): void => {
  montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
};

export async function inicializarHUB(root: HTMLElement): Promise<void> {
  iniciarVigia(FASE);
  iniciarControlesShell();
  suscribirAlCambio(() => repintarVista());
  const cfg = (globalThis as { __HUB_CONFIG__?: { supabaseUrl?: string } }).__HUB_CONFIG__;
  const sesion = cfg?.supabaseUrl ? auth.leer() : null;
  if (!sesion) {
    volverALogin(root);
    return;
  }
  await montarShellAutenticado(root, sesion);
}

export async function montarShellAutenticado(root: HTMLElement, sesionPrevia?: SessionUsuario): Promise<void> {
  const sesion = sesionPrevia ?? auth.leer();
  if (!sesion) {
    volverALogin(root);
    return;
  }
  const tenResult = await resolverTenant(sesion);
  if (!tenResult.ok) {
    if (tenResult.error.kind === "no_autorizado") {
      await auth.cerrar();
      volverALogin(root);
      return;
    }
    manejarOnboarding(root, sesion, (ses) => void montarShellAutenticado(root, ses), async () => {
      await auth.cerrar();
      volverALogin(root);
    });
    return;
  }
  const ten = tenResult.value;
  const contexto: AppContext = Object.freeze({
    uid: sesion.uid, email: sesion.email, tenantId: ten.tenantId, tenantName: ten.name, tenantPlan: ten.plan,
  });
  const app = new HUBApp(contexto, async () => {
    const res = await cargarInbox(sesion);
    return res.ok ? res.value : [];
  }, async () => {
    const r = await cargarSafe(sesion);
    return r.ok ? r.value : null;
  });
  await app.iniciar();
  registrarVista(root, app);
  renderVista(root, app);
}