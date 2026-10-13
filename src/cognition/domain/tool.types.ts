/**
 * HUB by Raisen — Tipos del Tool Registry (BC Cognition).
 * Separados para cumplir C4 (< 75 lineas por archivo).
 *
 * Sin any.
 */
export type ContentType =
  | "text" | "template" | "image" | "video" | "audio" | "document"
  | "location" | "contact_card" | "sticker" | "reaction" | "system_event";

export interface ToolDef {
  readonly name: string;
  readonly description: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly minConfidence: number;
  readonly requiresSafeEvaluation: boolean;
  readonly preconditions: readonly string[];
  readonly escalationTriggers: readonly string[];
}