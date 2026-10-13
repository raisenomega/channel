/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Importa el sistema de estilos OMEGA y monta login o shell con tenant.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";
import { auth, SessionUsuario } from "./auth-client.ts";
import { resolverTenant } from "./tenant-client.ts";
import { cargarInbox } from "./inbox-client.ts";
import { montarLogin } from "./login-view.ts";
import type { AppContext } from "./types.ts";

interface HubConfigGlobal {
  __HUB_CONFIG__?: { supabaseUrl: string; anonKey: string };
}

interface MountTarget {
  innerHTML: string;
}

export async function inicializarHUB(root: HTMLElement): Promise<void> {
  const config = (globalThis as HubConfigGlobal).__HUB_CONFIG__;
  if (!config?.supabaseUrl) {
    montarLogin(root, {
      onAutenticado: () => void montarShellAutenticado(root),
    });
    return;
  }
  const session = auth.leer();
  if (!session) {
    montarLogin(root, {
      onAutenticado: () => void montarShellAutenticado(root),
    });
    return;
  }
  await montarShellAutenticado(root, session);
}

async function montarShellAutenticado(root: HTMLElement, sesionPrevia?: SessionUsuario): Promise<void> {
  const sesion = sesionPrevia ?? auth.leer();
  if (!sesion) {
    montarLogin(root, { onAutenticado: () => void montarShellAutenticado(root) });
    return;
  }
  const tenResult = await resolverTenant(sesion);
  if (!tenResult.ok) {
    root.innerHTML = `<div class="login-wrap"><p class="text-sm text-muted">Sesion activa pero sin tenant asignado.</p></div>`;
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

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) void inicializarHUB(el as HTMLElement);
}