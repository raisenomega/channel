/**
 * HUB by Raisen — Canal: acciones interactivas del shell (FASE 9.5-9.7).
 * Mutan el estado local (channel-store) y sincronizan a Supabase best-effort.
 * main.ts inyecta `reRender` para repintar la vista sin perder estado.
 */
import { actualizarCanal, actualizarProveedor, cargarEstado, EstadoCanales } from "./channel-store.ts";
import { sincronizarAutonomia, sincronizarInbox, sincronizarProveedor } from "./channel-sync.ts";
import type { CanalState, SyncMark } from "./channel-model.ts";

let reRender: () => void = () => {};
let estado: EstadoCanales = cargarEstado();

export function conectarHandlersCanales(repintar: () => void): void {
  reRender = repintar;
  estado = cargarEstado();
  (globalThis as Record<string, unknown>).actuarCanal = (
    accion: string,
    params?: { id?: string },
  ) => {
    void resolver(accion, params ?? {});
  };
}

export function estadoActual(): EstadoCanales {
  return estado;
}

async function resolver(accion: string, params: { id?: string }): Promise<void> {
  const id = params.id ?? "";
  if (accion === "toggleCanal") {
    await alternarCanal(id, "active", sincronizarInbox);
  } else if (accion === "toggleAutonomia") {
    await alternarCanal(id, "autonomous", sincronizarAutonomia);
  } else if (accion === "guardarProveedor") {
    await guardarProveedor();
  }
}

type Sinc = (c: CanalState) => Promise<SyncMark>;

async function alternarCanal(
  id: string,
  campo: "active" | "autonomous",
  sinc: Sinc,
): Promise<void> {
  const target = estado.canales.find((c) => c.key === id);
  if (!target) return;
  const previo = target[campo];
  estado = actualizarCanal(estado, id, { [campo]: !previo, sync: "pending" });
  reRender();
  const actual = estado.canales.find((c) => c.key === id);
  if (!actual) return;
  const marca = await sinc(actual);
  estado = actualizarCanal(estado, id, { [campo]: !previo, sync: marca });
  reRender();
}

async function guardarProveedor(): Promise<void> {
  const sel = document.querySelector<HTMLSelectElement>("[data-ai-select]");
  const input = document.querySelector<HTMLInputElement>("[data-ai-key]");
  const provider = (sel?.value ?? estado.proveedor.provider) as EstadoCanales["proveedor"]["provider"];
  const apiKey = input?.value ?? "";
  estado = actualizarProveedor(estado, { provider, sync: "pending" });
  reRender();
  const marca = await sincronizarProveedor({ ...estado.proveedor, provider }, apiKey);
  estado = actualizarProveedor(estado, { keyConfigured: apiKey.length > 0, sync: marca });
  reRender();
}