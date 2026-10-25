/**
 * HUB by Raisen — Sistema B fase 1: timer in-process que escanea quietud cada N min. Gated por
 * FOLLOWUP_ENABLED (default off) -> deploy seguro, cero efecto hasta encender. No bloquea el arranque. C4 <=75.
 */
import * as nodeProcess from "node:process";
import { conversacionesQuietas } from "../cognition/infrastructure/quiet-conversations.query.ts";
import { FollowupScanner } from "../cognition/application/followup-scanner.ts";
import { buildStrategic } from "./followup-wrapper.ts";

export function startFollowupTimer(): void {
  if ((nodeProcess.env["FOLLOWUP_ENABLED"] ?? "") !== "true") return;
  const min = Math.max(1, parseInt(nodeProcess.env["FOLLOWUP_SCAN_MIN"] ?? "30", 10));
  const horas = Math.max(1, parseInt(nodeProcess.env["FOLLOWUP_QUIET_H"] ?? "5", 10));
  const service = buildStrategic();
  const scanner = new FollowupScanner((h) => conversacionesQuietas(h), (c) => service.procesar(c));
  console.log(`[followup] timer ON: cada ${min}min, quietud >=${horas}h`);
  setInterval(() => void scanner.escanear(horas).catch((e) => console.error("[followup] scan error", e)), min * 60_000);
}
