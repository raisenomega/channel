/**
 * HUB by Raisen — Tests A-01..A-06 (alineados a la SOT del Panel: docs/DASHBOARD_PANEL_SOT.md).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { BentoEstadoAgentes } from "@/components/dashboard/bentobox/bento-estado-agentes";
import { BentoActividadReciente } from "@/components/dashboard/bentobox/bento-actividad-reciente";
import { BentoRowNueva } from "@/components/dashboard/bentobox/bento-row-nueva";
import { enCore } from "@/lib/i18n/en-core";
import { esCore } from "@/lib/i18n/es-core";

const EN = "en" as const;
const ES = "es" as const;

describe("A-01: RENAME_DASHBOARD", () => {
  it("EN nav label is Dashboard", () => {
    expect(enCore["nav.dashboard"]).toBe("Dashboard");
  });
  it("ES nav label is Dashboard", () => {
    expect(esCore["nav.dashboard"]).toBe("Panel");
  });
});

describe("A-02: BENTO L3 = 4 cards (Estado · Actividad · Peticiones · Búsqueda)", () => {
  it("renders the 4 cards EN (sin card Add client)", () => {
    render(<BentoRowNueva lang={EN} events={[]} items={[]} onOpen={vi.fn()} />);
    expect(screen.queryByText("Add client")).toBeNull();
    expect(screen.getByText("AI Agents status")).toBeDefined();
    expect(screen.getByText("Recent activity")).toBeDefined();
    expect(screen.getByText("Requests")).toBeDefined();
    expect(screen.getByText("Smart search")).toBeDefined();
  });
  it("renders the 4 cards ES", () => {
    render(<BentoRowNueva lang={ES} events={[]} items={[]} onOpen={vi.fn()} />);
    expect(screen.getByText("Estado de agentes IA")).toBeDefined();
    expect(screen.getByText("Actividad reciente")).toBeDefined();
    expect(screen.getByText("Peticiones")).toBeDefined();
    expect(screen.getByText("Búsqueda inteligente")).toBeDefined();
  });
});

describe("A-03 (SOT): el CTA 'Crear mi negocio' vive en la barra de WhatsApp, no en una card", () => {
  it("registro-whatsapp tiene el boton registro-crear con dash.createMyBusiness", () => {
    const SRC = readFileSync("apps/tanstack/src/components/dashboard/registro/registro-whatsapp.tsx", "utf8");
    expect(SRC).toContain('data-testid="registro-crear"');
    expect(SRC).toContain("dash.createMyBusiness");
  });
});

describe("A-04: CARD2_7_AGENTES", () => {
  it("renders 7 canonical agents", () => {
    render(<BentoEstadoAgentes lang={EN} />);
    for (const n of ["Victor","Zahra","Thao","Iris","Eco","Angel","Kelsy"]) {
      expect(screen.getByText(n)).toBeDefined();
    }
  });
});

describe("A-05: CARD3_5_EVENTOS", () => {
  it("shows max 5 events", () => {
    const ev = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), type: "t", label: "E"+i, timestamp: "",
    }));
    render(<BentoActividadReciente lang={EN} events={ev} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeLessThanOrEqual(5);
  });
  it("shows empty state", () => {
    render(<BentoActividadReciente lang={EN} events={[]} />);
    expect(screen.getByText("No recent activity")).toBeDefined();
  });
});

describe("A-06 (SOT): el Panel (L3) no tiene tarjeta de crear negocio", () => {
  it("BentoRowNueva no muestra 'Agregar cliente' ni 'Crear mi negocio'", () => {
    render(<BentoRowNueva lang={ES} events={[]} items={[]} onOpen={vi.fn()} />);
    expect(screen.queryByText("Agregar cliente")).toBeNull();
    expect(screen.queryByText("Crear mi negocio")).toBeNull();
  });
});
