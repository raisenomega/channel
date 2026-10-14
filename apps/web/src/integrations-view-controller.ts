/**
 * HUB by Raisen — Controller: vincula el handler global de integraciones y arranca la carga.
 */
import { registrarRepintado } from "./integrations-view-state.ts";
import { cargar, resolver } from "./integrations-view-actions.ts";

/** Vincula el handler global e inicia la carga real (JWT+RLS) sin bloquear. */
export function conectarHandlersIntegraciones(repintar: () => void): void {
  registrarRepintado(repintar);
  (globalThis as Record<string, unknown>).actuarIntegracion = (
    accion: string,
    params?: { id?: string },
  ) => {
    void resolver(accion, params ?? {});
  };
  void cargar();
}