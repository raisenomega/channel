/**
 * HUB by Raisen — Kit compartido de las Gráficas del Panel (SOT: docs/DASHBOARD_PANEL_SOT.md).
 * Paleta futurista + celda (área fija + leyenda debajo) + estado vacío honesto (cero-mocks). C4 <=75.
 */
import type { ReactNode } from "react";

/** Colores dinámicos/futuristas (neón) para las series. */
export const FUTURE_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#60a5fa", "#fbbf24"] as const;

/** Celda de gráfica: área de alto fijo + leyenda (título) debajo, centrada. No cambia estilos de card. */
export function ChartCell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-[150px] w-full">{children}</div>
      <span className="mt-2 text-center text-xs font-semibold text-foreground">{title}</span>
    </div>
  );
}

/** Estado vacío honesto: sin endpoint real todavía -> nunca series inventadas. */
export function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40">
      <span className="text-[11px] text-dim">{label}</span>
    </div>
  );
}
