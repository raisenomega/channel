/**
 * HUB by Raisen — M-9 (A-M-9): el KPI TENANT muestra tenant.name (no vacio).
 * Render real de KpiRow en jsdom.
 */
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardStats } from "@/lib/types";
import { KpiRow } from "@/routes/inbox/inbox-widgets";

vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ pathname: "/inbox" }) }));

const STATS = { abiertas: 0, sinAsignar: 0 } as unknown as DashboardStats;

test("A-M-9 KpiRow con tenantName='Zafacones Ramos' lo renderiza visible", () => {
  render(<KpiRow language="es" stats={STATS} total={0} tenantName="Zafacones Ramos" tenantPlan="ecosystem" />);
  expect(screen.getByText("Zafacones Ramos")).toBeDefined();
});

test("A-M-9 sin tenantName -> placeholder (no crashea, no vacio silencioso)", () => {
  render(<KpiRow language="es" stats={STATS} total={0} />);
  expect(screen.getByText("—")).toBeDefined();
});
