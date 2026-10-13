import { Result, err, ok } from "../../shared/domain/result.ts";

export const crearConfianza = (v: number): Result<ConfidenceVO, ConfError> => {
  if (!Number.isFinite(v)) return err({ kind: "non_finite" });
  if (v < 0 || v > 1) return err({ kind: "out_of_range" });
  return ok(Object.freeze({ value: v }));
};

export type ConfidenceAction =
  | { readonly kind: "actuar_sin_preguntar" }   // >= 0.9
  | { readonly kind: "actuar_con_confirmacion" } // >= 0.7
  | { readonly kind: "sugerir_con_disclaimer" }  // >= 0.3
  | { readonly kind: "escalar" };                 // < 0.3

export const decidirAccionPorConfianza = (v: number): ConfidenceAction => {
  if (v >= 0.9) return { kind: "actuar_sin_preguntar" };
  if (v >= 0.7) return { kind: "actuar_con_confirmacion" };
  if (v >= 0.3) return { kind: "sugerir_con_disclaimer" };
  return { kind: "escalar" };
};

export interface ConfidenceVO {
  readonly value: number;
}

export type ConfError =
  | { readonly kind: "non_finite" }
  | { readonly kind: "out_of_range" };

export interface AutonomyConfigState {
  readonly channel: string | null;
  readonly scheduleStart: string | null;
  readonly scheduleEnd: string | null;
  readonly allowedActions: readonly string[];
  readonly requiresHumanApproval: readonly string[];
  readonly isActive: boolean;
}

export const estaEnHorarioAutonomo = (config: AutonomyConfigState, ahora: string): boolean => {
  if (!config.isActive) return false;
  if (!config.scheduleStart || !config.scheduleEnd) return true;
  return ahora >= config.scheduleStart && ahora <= config.scheduleEnd;
};