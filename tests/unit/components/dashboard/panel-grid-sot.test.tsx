/**
 * HUB by Raisen — Rejilla canónica del Panel (SOT: docs/DASHBOARD_PANEL_SOT.md).
 * Línea 2 (WidgetsRow) = 3 tarjetas full-width col-4. Línea 3 (BentoRowNueva) = 4 tarjetas col-3
 * (Estado · Actividad · Peticiones · Búsqueda inteligente). Reemplaza al viejo A-T-2 (2-col/col-6).
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { WidgetsRow } from "@/routes/inbox/inbox-widgets";
import { BentoRowNueva } from "@/components/dashboard/bentobox/bento-row-nueva";
import type { DashboardStats } from "@/lib/types";

const stats = {} as DashboardStats;

describe("Panel grid (SOT)", () => {
  it("L2 WidgetsRow: 3 tarjetas col-4 (full-width), ninguna col-6", () => {
    const { container } = render(<WidgetsRow language="es" stats={stats} items={[]} sinDatos />);
    expect(container.querySelectorAll(".bento-col-4").length).toBe(3);
    expect(container.querySelectorAll(".bento-col-6").length).toBe(0);
  });

  it("L3 BentoRowNueva: 4 tarjetas col-3 (Estado·Actividad·Peticiones·Búsqueda)", () => {
    const { container } = render(<BentoRowNueva lang="es" events={[]} items={[]} onOpen={vi.fn()} />);
    expect(container.querySelectorAll(".bento-col-3").length).toBe(4);
    expect(container.querySelectorAll(".bento-col-6").length).toBe(0);
  });
});
