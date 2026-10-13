/**
 * HUB by Raisen — Panel de gobernanza SAFE (FASE 11).
 * Estado de autonomia (fases 0-4 + kill switch) y metricas SAFE reales.
 */
import { lucide } from "@shared/domain/lucide-icons.ts";
import type { Idioma } from "./i18n.ts";
import { t } from "./i18n.ts";
import type { AutonomyPhase, SafeSnapshot } from "./types.ts";

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

function estadoAutonomia(d: SafeRenderData, lang: Idioma, desc: string, kill: string): string {
  const label = d.sinDatos
    ? t(lang, "safe.noAutonomy")
    : t(lang, "safe.phaseLabel").replace("{fase}", String(d.phase));
  return `<div class="safe-row flex items-center gap-sm">
    <div class="glyph" style="color:var(--agent)">${lucide("agent", { size: 20, color: "var(--agent)" })}</div>
    <div class="safe-phases">${fases(d.phase)}</div>
    <div>
      <b class="text-sm">${t(lang, "safe.autonomy")}: ${label}</b>
      ${desc}
      ${kill}
    </div>
  </div>`;
}

function fases(actual: AutonomyPhase): string {
  let html = "";
  for (let i = 0; i <= 4; i += 1) {
    const activa = i === actual;
    const cls = activa ? "safe-step on" : "safe-step";
    html += `<span class="${cls}" data-phase="${i}">${i}</span>`;
  }
  return html;
}

function metricas(d: SafeRenderData, lang: Idioma): string {
  if (d.sinDatos) {
    return `<p class="text-sm text-muted" style="margin:12px 0 0">${t(lang, "safe.empty")}</p>`;
  }
  const disagreement = d.disagreementPct === null
    ? t(lang, "safe.noDisagreement")
    : `${d.disagreementPct.toFixed(1)}%`;
  return `<div class="kpis grid grid-cols-2 gap" style="margin-top:14px">
    <div class="kpi"><div class="kpi-label">${t(lang, "safe.totalEvals")}</div><div class="kpi-value" style="font-size:20px">${d.totalEvaluaciones}</div></div>
    <div class="kpi"><div class="kpi-label">${t(lang, "safe.disagreementAvg")}</div><div class="kpi-value" style="font-size:20px;color:var(--medium)">${disagreement}</div></div>
    <div class="kpi"><div class="kpi-label" style="color:var(--good)">${t(lang, "safe.approved")}</div><div class="kpi-value" style="font-size:20px;color:var(--good)">${d.approved}</div></div>
    <div class="kpi"><div class="kpi-label" style="color:var(--medium)">${t(lang, "safe.abstained")}</div><div class="kpi-value" style="font-size:20px;color:var(--medium)">${d.abstained}</div></div>
    <div class="kpi"><div class="kpi-label" style="color:var(--critical)">${t(lang, "safe.blocked")}</div><div class="kpi-value" style="font-size:20px;color:var(--critical)">${d.blocked}</div></div>
  </div>`;
}
