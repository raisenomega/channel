/**
 * HUB by Raisen — Acciones (cargar/toggle) de la vista de integraciones.
 */
import { cargarIntegraciones, guardarIntegracion, TIPO_INTEGRACION } from "./integrations-client.ts";
import { estado, actualizarEstado, type SyncIntegracion } from "./integrations-view-state.ts";

export async function cargar(): Promise<void> {
  const res = await cargarIntegraciones();
  if (res.ok) {
    actualizarEstado({ configs: res.value, sync: "ok" });
  } else {
    actualizarEstado({ configs: estado.configs, sync: "error" });
  }
}

export async function resolver(accion: string, params: { id?: string }): Promise<void> {
  if (accion !== "toggleIntegracion") return;
  const id = params.id ?? "";
  const tipo = TIPO_INTEGRACION.find((t) => t === id);
  if (!tipo) return;
  const config = estado.configs.find((c) => c.type === tipo);
  if (!config) return;
  const objetivo = !config.isActive;
  actualizarEstado({
    configs: estado.configs.map((c) => c.type === tipo ? { ...c, isActive: objetivo } : c),
    sync: "pending",
  });
  const res = await guardarIntegracion(tipo, objetivo);
  const marca: SyncIntegracion = res.ok ? "ok" : "error";
  actualizarEstado({ configs: estado.configs, sync: marca });
}