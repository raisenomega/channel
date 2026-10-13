/**
 * HUB by Raisen — Vista de integraciones ecosistema (FASE 8).
 * Renderiza la lista de integraciones disponibles (NUCLEO, OMEGA, POS, TABLE,
 * HEALTH, HOME, FLEET) con icono, nombre, estado conectado/no conectado y
 * toggle. Si no hay configuraciones, muestra un estado vacio honesto (N5);
 * si no se pudo leer (sin sesion/red), tambien es honesto con la marca local.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";
import {
  cargarIntegraciones,
  guardarIntegracion,
  TIPO_INTEGRACION,
  type IntegrationConfig,
  type IntegrationType,
} from "./integrations-client.ts";

export type SyncIntegracion = "pending" | "ok" | "error";

export interface EstadoIntegraciones {
  readonly configs: readonly IntegrationConfig[];
  readonly sync: SyncIntegracion;
}

const CLAVE_LOCAL = "hub.integraciones";
const VACIO: EstadoIntegraciones = Object.freeze({
  configs: Object.freeze([]),
  sync: "ok",
});

interface IconoIntegracion {
  readonly type: IntegrationType;
  readonly icon: string;
}

const ICONOS: readonly IconoIntegracion[] = Object.freeze([
  { type: "nucleo", icon: "channels" },
  { type: "omega", icon: "agent" },
  { type: "pos", icon: "chat" },
  { type: "table", icon: "star" },
  { type: "health", icon: "bell" },
  { type: "home", icon: "inbox" },
  { type: "fleet", icon: "send" },
]);

let reRender: () => void = () => {};
let estado: EstadoIntegraciones = cargarCache();

/** Vincula el handler global e inicia la carga real (JWT+RLS) sin bloquear. */
export function conectarHandlersIntegraciones(repintar: () => void): void {
  reRender = repintar;
  (globalThis as Record<string, unknown>).actuarIntegracion = (
    accion: string,
    params?: { id?: string },
  ) => {
    void resolver(accion, params ?? {});
  };
  // Carga inicial de datos reales; en fallo mantiene estado honesto.
  void cargar();
}

export function estadoIntegraciones(): EstadoIntegraciones {
  return estado;
}

async function cargar(): Promise<void> {
  const res = await cargarIntegraciones();
  if (res.ok) {
    estado = { configs: res.value, sync: "ok" };
  } else {
    // No se pudo leer del servidor: se conserva lo cargado y se marca el
    // error de forma honesta (N5), sin inventar ningun estado conectado.
    estado = { configs: estado.configs, sync: "error" };
  }
  persistir();
  reRender();
}

async function resolver(accion: string, params: { id?: string }): Promise<void> {
  if (accion !== "toggleIntegracion") return;
  const id = params.id ?? "";
  const tipo = TIPO_INTEGRACION.find((tipo) => tipo === id);
  if (!tipo) return;
  const config = estado.configs.find((c) => c.type === tipo);
  if (!config) return;
  const objetivo = !config.isActive;
  estado = {
    configs: estado.configs.map((c) =>
      c.type === tipo ? { ...c, isActive: objetivo } : c,
    ),
    sync: "pending",
  };
  persistir();
  reRender();
  const res = await guardarIntegracion(tipo, objetivo);
  const marca = res.ok ? "ok" : "error";
  estado = { configs: estado.configs, sync: marca };
  persistir();
  reRender();
}

function cargarCache(): EstadoIntegraciones {
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL);
    if (!raw) return VACIO;
    const data = JSON.parse(raw) as {
      configs?: IntegrationConfig[];
      sync?: SyncIntegracion;
    };
    const configs = Array.isArray(data.configs)
      ? data.configs.filter((c) => c && typeof c.type === "string")
      : [];
    return {
      configs: Object.freeze(configs),
      sync: data.sync === "pending" || data.sync === "error" ? data.sync : "ok",
    };
  } catch {
    return VACIO;
  }
}

function persistir(): void {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(estado));
  } catch {
    // ignora: cache local opcional
  }
}

/** Render de la seccion de integraciones dentro de la pestana Canales. */
export function renderIntegraciones(lang: Idioma): string {
  const conectadas = estado.configs.filter((c) => c.isActive).length;
  return `<div class="section text-sm font-bold text-muted">${t(lang, "integrations.title")}
      <span class="more text-xs text-hub">${conectadas} ${t(lang, "integrations.count")}</span>
    </div>
    <div class="card" style="padding:6px 12px">
      ${lista(estado.configs, lang)}
    </div>
    ${
      estado.sync === "pending"
        ? `<div class="text-xs text-dim" style="margin-top:4px">${t(lang, "integrations.pending")}</div>`
        : estado.sync === "error"
          ? `<div class="text-xs text-dim" style="margin-top:4px">${t(lang, "integrations.syncError")}</div>`
          : ""
    }`;
}

function lista(configs: readonly IntegrationConfig[], lang: Idioma): string {
  if (configs.length === 0) {
    // N5: estado vacio honesto — nada conectado porque no hay configuraciones.
    return `<div class="p-md text-sm text-muted" style="text-align:center;padding:18px 8px">
        ${lucide("channels", { size: 20 })}
        <div style="margin-top:8px">${t(lang, "integrations.empty")}</div>
      </div>`;
  }
  return configs
    .map((c) => {
      const icon = ICONOS.find((i) => i.type === c.type)?.icon ?? "channels";
      return `<div class="feat flex items-center gap-sm">
          ${lucide(icon, { size: 16 })}
          <span class="text-sm">${t(lang, `integrations.${c.type}`)}</span>
          <span class="chip-status flex items-center gap-xs text-xs text-muted ml-auto" style="margin-top:0">
            <span class="dot ${c.isActive ? "dot-on" : "dot-off"}"></span>
            ${c.isActive ? t(lang, "channels.active") : t(lang, "channels.inactive")}
          </span>
          <div class="switch ${c.isActive ? "on" : "off"}"
            onclick="actuarIntegracion('toggleIntegracion',{id:'${c.type}'})"><i></i></div>
        </div>`;
    })
    .join("");
}