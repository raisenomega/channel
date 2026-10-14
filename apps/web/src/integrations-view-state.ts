/**
 * HUB by Raisen — Estado de la vista de integraciones.
 */
import type { IntegrationConfig } from "./integrations-client.ts";

export type SyncIntegracion = "pending" | "ok" | "error";

export interface EstadoIntegraciones {
  readonly configs: readonly IntegrationConfig[];
  readonly sync: SyncIntegracion;
}

const CLAVE_LOCAL = "hub.integraciones";
export const VACIO: EstadoIntegraciones = Object.freeze({
  configs: Object.freeze([]),
  sync: "ok",
});

export function cargarCache(): EstadoIntegraciones {
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    if (!raw) return VACIO;
    const data = JSON.parse(raw) as { configs?: IntegrationConfig[]; sync?: SyncIntegracion };
    const configs = Array.isArray(data.configs) ? data.configs.filter((c) => c && typeof c.type === "string") : [];
    return {
      configs: Object.freeze(configs),
      sync: data.sync === "pending" || data.sync === "error" ? data.sync : "ok",
    };
  } catch {
    return VACIO;
  }
}

export let reRender: () => void = () => {};
export let estado: EstadoIntegraciones = cargarCache();

export function estadoIntegraciones(): EstadoIntegraciones {
  return estado;
}

export function registrarRepintado(repintar: () => void): void {
  reRender = repintar;
}

export function actualizarEstado(next: EstadoIntegraciones): void {
  estado = next;
  persistirEstado();
  reRender();
}

function persistirEstado(): void {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(estado));
  } catch {
    // ignora: cache local opcional
  }
}