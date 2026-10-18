/**
 * HUB by Raisen — T-2 (Compuerta #111): densidad 2 columnas por fila. Los 5 modulos del dashboard
 * (Distribucion + SLA + Pendientes + EstadoAgentes + Actividad) usan bento-col-6 (span 6/12 = 2 por
 * fila), eliminando la "mitad de pantalla vacia" (antes EstadoAgentes+Actividad eran col-3 = 6/12).
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WidgetsRow } from "@/routes/inbox/inbox-widgets";
import { BentoRowNueva } from "@/components/dashboard/bentobox/bento-row-nueva";
import type { DashboardStats } from "@/lib/types";

const stats = {} as DashboardStats;

describe("Dashboard grid 2-col (T-2)", () => {
  it("A-T-2-1: los 3 modulos de WidgetsRow son bento-col-6 (2 por fila), ninguno col-4", () => {
    const { container } = render(<WidgetsRow language="es" stats={stats} items={[]} sinDatos />);
    expect(container.querySelectorAll(".bento-col-6").length).toBe(3);
    expect(container.querySelectorAll(".bento-col-4").length).toBe(0);
  });

  it("A-T-2-2: EstadoAgentes + Actividad son bento-col-6 (fila llena, no media vacia) — 5 modulos 2-col", () => {
    const { container } = render(<BentoRowNueva lang="es" events={[]} />);
    expect(container.querySelectorAll(".bento-col-6").length).toBe(2);
    expect(container.querySelectorAll(".bento-col-3").length).toBe(0);
  });
});
