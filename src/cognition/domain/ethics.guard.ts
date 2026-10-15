/**
 * HUB by Raisen — EthicsGuard: verifica entrada y acciones propuestas.
 * evaluarAccion bloquea ACCIONES_PROHIBIDAS en codigo (X5).
 * Corre para todos los proveedores via AgentSafeGate.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { ACCIONES_PROHIBIDAS } from "./limits.ts";

export class EthicsGuard {
  static evaluar(message: string, detectedIntent: string): Result<void, EthicsViolation> {
    const lower = message.toLowerCase();
    if (lower.includes("queja") || lower.includes("quej") ||
        lower.includes("reclamo") || lower.includes("complaint")) {
      return err({ kind: "complaint_detected" });
    }
    if (detectedIntent === "health" &&
        (lower.includes("dolor") || lower.includes("sintoma") ||
         lower.includes("emergencia") || lower.includes("urgencia"))) {
      return err({ kind: "health_emergency" });
    }
    return ok(undefined);
  }

  static evaluarAccion(actionName: string): Result<void, EthicsViolation> {
    if (ACCIONES_PROHIBIDAS.has(actionName)) {
      return err({ kind: "accion_prohibida", action: actionName });
    }
    return ok(undefined);
  }
}

export type EthicsViolation =
  | { readonly kind: "complaint_detected" }
  | { readonly kind: "health_emergency" }
  | { readonly kind: "legal_risk" }
  | { readonly kind: "accion_prohibida"; readonly action: string };