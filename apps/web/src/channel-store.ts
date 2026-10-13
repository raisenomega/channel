/**
 * HUB by Raisen — Canal: estado de la configuracion (localStorage).
 * Almacena el estado de canales, autonomia y proveedor. El sync a Supabase
 * lo hace channel-sync.ts por separado; aqui se garantiza el P1 local honesto.
 */
import { CANALES, CanalState, ProveedorState, ProviderKey, SyncMark, canalDe } from "./channel-model.ts";

const KEY = "hub.canales";

export interface EstadoCanales {
  canales: readonly CanalState[];
  proveedor: ProveedorState;
}

export function estadoInicial(): EstadoCanales {
  return Object.freeze({
    canales: CANALES.map(({ key }) => Object.freeze({ key, active: false, autonomous: false, sync: "pending" as SyncMark })),
    proveedor: Object.freeze({ provider: "anthropic" as ProviderKey, keyConfigured: false, sync: "pending" as SyncMark }),
  });
}

function leer(): unknown {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as unknown;
  } catch {
    return null;
  }
}

export function cargarEstado(): EstadoCanales {
  const raw = leer();
  if (!raw || typeof raw !== "object") return estadoInicial();
  const r = raw as Record<string, unknown>;
  const prov = r.proveedor && typeof r.proveedor === "object"
    ? (r.proveedor as Partial<ProveedorState>)
    : {};
  return Object.freeze({
    canales: CANALES.map(({ key }) => {
      const fila = (r.canales as Array<Partial<CanalState>> | undefined)?.find((c) => c.key === key);
      return Object.freeze({
        key,
        active: fila?.active === true,
        autonomous: fila?.autonomous === true,
        sync: (fila?.sync as SyncMark | undefined) ?? "pending",
      });
    }),
    proveedor: Object.freeze({
      provider: (prov.provider as ProviderKey | undefined) ?? "anthropic",
      keyConfigured: prov.keyConfigured === true,
      sync: (prov.sync as SyncMark | undefined) ?? "pending",
    }),
  });
}

function guardar(estado: EstadoCanales): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(estado));
  } catch {
    // sin storage disponible: estado solo en memoria
  }
}

export function actualizarCanal(estado: EstadoCanales, id: string, cambio: Partial<CanalState>): EstadoCanales {
  const key = canalDe(id);
  const canales = estado.canales.map((c) => c.key === key ? Object.freeze({ ...c, ...cambio }) : c);
  const nuevo = Object.freeze({ ...estado, canales }) as EstadoCanales;
  guardar(nuevo);
  return nuevo;
}

export function actualizarProveedor(estado: EstadoCanales, cambio: Partial<ProveedorState>): EstadoCanales {
  const nuevo = Object.freeze({ ...estado, proveedor: Object.freeze({ ...estado.proveedor, ...cambio }) }) as EstadoCanales;
  guardar(nuevo);
  return nuevo;
}