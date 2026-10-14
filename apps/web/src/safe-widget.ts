/**
 * HUB by Raisen — Panel de gobernanza SAFE (FASE 11).
 * Helpers de render en safe-widget-render.ts (C4 ≤75).
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { AutonomyPhase, SafeSnapshot } from "./types.ts";
import { estadoAutonomia, metricas } from "./safe-widget-render.ts";

export interface SafeRenderData {
  readonly totalEvaluaciones: number;
  readonly disagreementPct: number | null;
  readonly blocked: number;
  readonly abstained: number;
  readonly approved: number;
  readonly phase: AutonomyPhase;
  readonly isKillSwitched: boolean;
  readonly killSwitchReason: string | null;
  readonly sinDatos: boolean;
}

export function snapshotAWidget(s: SafeSnapshot | null): SafeRenderData {
  const p = s?.progresion ?? null;
  return {
    totalEvaluaciones: s?.totalEvaluaciones ?? 0,
    disagreementPct: s?.disagreementPromedioPct ?? null,
    blocked: s?.decisiones.blocked ?? 0,
    abstained: s?.decisiones.abstained ?? 0,
    approved: s?.decisiones.approved ?? 0,
    phase: p?.currentPhase ?? 0,
    isKillSwitched: p?.isKillSwitched ?? false,
    killSwitchReason: p?.killSwitchReason ?? null,
    sinDatos: !s,
  };
}

export function renderSafeWidget(raw: SafeSnapshot | null, lang: Idioma): string {
  const d = snapshotAWidget(raw);
  const desc = d.isKillSwitched || d.sinDatos
    ? ""
    : `<div class="text-sm text-muted" style="margin-top:2px">${t(lang, `safe.phase${d.phase}`)}</div>`;
  const kill = d.isKillSwitched
    ? `<div class="badge badge-danger tap" style="margin:8px 0 0">${lucide("warning-triangle", { size: 14, color: "var(--critical)" })} ${t(lang, "safe.killSwitchOn")}</div>`
    : `<div class="badge badge-good">${lucide("check", { size: 14, color: "var(--good)" })} ${t(lang, "safe.killSwitchOff")}</div>`;
  return `<div class="section text-sm font-bold text-muted" style="margin-top:16px">${t(lang, "safe.title")}</div>
    <div class="card safe" style="padding:14px">
      ${estadoAutonomia(d, lang, desc, kill)}
      ${metricas(d, lang)}
    </div>`;
}