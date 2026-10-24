/**
 * HUB by Raisen — Capacidades de Victor (B6). HONESTO: lee el TOOL_REGISTRY real (no inventa). Victor
 * CONOCE las acciones del sistema y recomienda cual aplica, pero en su chat de planificacion NO ejecuta
 * (su chat corre sin tools). Las acciones las ejecutan los flujos de cada agente. A2 dominio. C4 <=75.
 */
import { TOOL_REGISTRY } from "./tool.registry.ts";

export function buildCapabilitiesBlock(): string {
  const names = Object.keys(TOOL_REGISTRY);
  return [
    `El sistema HUB define ${names.length} acciones que los agentes pueden ejecutar: ${names.join(", ")}.`,
    "En ESTE chat de planificacion con el dueno tu rol es analizar, planificar y recomendar que accion y que agente aplican — NO las ejecutas tu mismo.",
    "Si te piden ejecutar algo, dilo con honestidad: se ejecuta por el flujo del agente correspondiente, no desde este chat.",
  ].join("\n");
}
