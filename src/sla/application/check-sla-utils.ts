/**
 * HUB by Raisen — SLA: utilidades de orden y error para el handler.
 */
import type { SLAPolicyState, SLAPriority } from "../domain/sla-policy.entity.ts";

export function prioridadSort(a: SLAPolicyState, b: SLAPolicyState): number {
  const orden: Record<SLAPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return (orden[a.priority] ?? 99) - (orden[b.priority] ?? 99);
}

export function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}