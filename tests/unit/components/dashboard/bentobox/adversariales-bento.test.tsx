/**
 * HUB by Raisen — Tests A-01..A-06.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BentoTenant } from "@/components/dashboard/bentobox/bento-tenant";
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

describe("A-02: BENTO_NUEVO_2_CARDS (R-1: card AgregarCliente eliminada)", () => {
  it("renders EstadoAgentes + Actividad EN (sin card Add client)", () => {
    render(<BentoRowNueva lang={EN} events={[]} />);
    expect(screen.queryByText("Add client")).toBeNull();
    expect(screen.getByText("AI Agents status")).toBeDefined();
    expect(screen.getByText("Recent activity")).toBeDefined();
  });
  it("renders EstadoAgentes + Actividad ES", () => {
    render(<BentoRowNueva lang={ES} events={[]} />);
    expect(screen.getByText("Estado de agentes IA")).toBeDefined();
    expect(screen.getByText("Actividad reciente")).toBeDefined();
  });
});

describe("A-03: CTA crear negocio ahora vive en el KPI Tenant ([+])", () => {
  it("boton [+] del BentoTenant dispara onCreate", () => {
    const fn = vi.fn();
    render(<BentoTenant label="TENANT" name="Zafacones" plan="ecosystem" createLabel="Crear mi negocio" onCreate={fn} />);
    screen.getByRole("button", { name: "Crear mi negocio" }).click();
    expect(fn).toHaveBeenCalledOnce();
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

describe("A-06: CLICK [+] KPI navega a onboarding", () => {
  it("triggers navigation callback", () => {
    const fn = vi.fn();
    render(<BentoTenant label="TENANT" name="X" plan="p" createLabel="Crear mi negocio" onCreate={fn} />);
    screen.getByRole("button", { name: "Crear mi negocio" }).click();
    expect(fn).toHaveBeenCalled();
  });
});