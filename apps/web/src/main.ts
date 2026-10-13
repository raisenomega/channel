/**
 * HUB by Raisen — bootstrap (entrada de la app)
 * Importa el sistema de estilos OMEGA (entrada unica) y monta login o shell.
 */
import "./styles/index.css";
import { HUBApp } from "./app.ts";
import { auth } from "./auth-client.ts";
import { montarLogin } from "./login-view.ts";

interface HubConfigGlobal {
  __HUB_CONFIG__?: { supabaseUrl: string; anonKey: string };
}

interface MountTarget {
  innerHTML: string;
}

export function inicializarHUB(root: MountTarget): void {
  const config = (globalThis as HubConfigGlobal).__HUB_CONFIG__;
  const session = auth.leer();
  if (!session || !config?.supabaseUrl) {
    montarLogin(root as HTMLElement, {
      onAutenticado: () => montarShell(root as HTMLElement),
    });
    return;
  }
  montarShell(root as HTMLElement);
}

function montarShell(root: HTMLElement): void {
  const app = new HUBApp();
  root.innerHTML = app.renderCurrentTab();
}

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) inicializarHUB(el);
}