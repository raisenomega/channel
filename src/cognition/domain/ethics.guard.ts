import { Result, err, ok } from "../../shared/domain/result.ts";

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
}

export type EthicsViolation =
  | { readonly kind: "complaint_detected" }
  | { readonly kind: "health_emergency" }
  | { readonly kind: "legal_risk" };