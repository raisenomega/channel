/**
 * HUB by Raisen — Tests A-01..A-06.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BentoAgregarCliente } from "@/components/dashboard/bentobox/bento-agregar-cliente";
import { BentoEstadoAgentes } from "@/components/dashboard/bentobox/bento-estado-agentes";
import { BentoActividadReciente } from "@/components/dashboard/bentobox/bento-actividad-reciente";
import { BentoRowNueva } from "@/components/dashboard/bentobox/bento-row-nueva";
import { enCore } from "@/lib/i18n/en-core";
import { esCore } from "@/lib/i18n/es-core";

const EN = "en" as const;
const ES = "es" as const;

describe("A-01: RENAME_DASHBOARD", () => {
  it("EN nav label is Dashboard", () => {
    expect(enCore["nav.inbox"]).toBe("Dashboard");
  });
  it("ES nav label is Dashboard", () => {
    expect(esCore["nav.inbox"]).toBe("Dashboard");
  });
});

describe("A-02: BENTO_NUEVO_3_CARDS", () => {
  it("renders 3 cards EN", () => {
    render(<BentoRowNueva lang={EN} onOpen={vi.fn()} events={[]} />);
    expect(screen.getByText("Add client")).toBeDefined();
    expect(screen.getByText("AI Agents status")).toBeDefined();
    expect(screen.getByText("Recent activity")).toBeDefined();
  });
  it("renders 3 cards ES", () => {
    render(<BentoRowNueva lang={ES} onOpen={vi.fn()} events={[]} />);
    expect(screen.getByText("Agregar cliente")).toBeDefined();
    expect(screen.getByText("Estado de agentes IA")).toBeDefined();
    expect(screen.getByText("Actividad reciente")).toBeDefined();
  });
});

describe("A-03: CARD1_CTA", () => {
  it("button triggers onOpen", () => {
    const fn = vi.fn();
    render(<BentoAgregarCliente lang={EN} onOpen={fn} />);
    screen.getByRole("button").click();
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

describe("A-06: CLICK_CARD1_NAV", () => {
  it("triggers navigation callback", () => {
    const fn = vi.fn();
    render(<BentoAgregarCliente lang={EN} onOpen={fn} />);
    screen.getByRole("button").click();
    expect(fn).toHaveBeenCalled();
  });
});