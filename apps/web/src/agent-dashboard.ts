import { lucide } from "../../../shared/domain/lucide-icons.ts";
import type { OperationMode } from "./types.ts";

export function renderAgentDashboard(
  wasCorrect: number,
  indistinguishability: number,
  autoRate: number,
  latency: string,
  providerName: string,
  modelName: string,
  byokConfigured: boolean,
  fallbackProvider: string | null,
  mode: OperationMode,
): string {
  return `<div class="view">
    <div class="brain">
      <div class="row1 flex items-center gap-sm">
        <div class="glyph">${lucide("agent", { size: 22, color: "var(--agent)" })}</div>
        <h3>Agente IA ${mode}
          <span class="block text-xs" style="color:#9FB4C4">Proveedor: ${providerName} · Modelo: ${modelName}</span>
        </h3>
      </div>
      <div class="agmetrics grid grid-cols-3 gap-sm" style="margin-top:14px">
        <div class="am"><b>${wasCorrect}%</b><small>Was Correct</small></div>
        <div class="am"><b>${indistinguishability}%</b><small>Indistinguibilidad</small></div>
        <div class="am"><b>${autoRate}%</b><small>Resolucion autonoma</small></div>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted" style="margin-top:16px">Metricas de calidad IA</div>
    <div class="kpis grid grid-cols-2 gap">
      <div class="kpi"><div class="kpi-label">Was Correct</div><div class="kpi-value" style="color:var(--good)">${wasCorrect}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">Indistinguibilidad</div><div class="kpi-value" style="color:var(--hub)">${indistinguishability}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">Resolucion autonoma</div><div class="kpi-value">${autoRate}<small>%</small></div></div>
      <div class="kpi"><div class="kpi-label">Latencia media</div><div class="kpi-value">${latency}</div></div>
    </div>
    <div class="section text-sm font-bold text-muted">Configuracion del proveedor IA</div>
    <div class="card" style="background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px">
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">Proveedor activo</span>
        <span class="text-hub font-bold">${providerName}</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">BYOK</span>
        <span class="text-hub" style="color:var(--hub-deep)">${byokConfigured ? "Usando key del tenant" : "Usando key de Raisen"}</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0">
        <span class="text-muted">Fallback</span>
        <span class="text-hub" style="color:var(--hub-deep)">${fallbackProvider ?? "No configurado"}</span>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted">Autonomia</div>
    <div class="card" style="padding:12px">
      <div class="feat flex items-center gap-sm">
        <div class="switch on"><i></i></div>
        <span>Fuera de horario laboral</span>
      </div>
      <div class="feat flex items-center gap-sm">
        <div class="switch on"><i></i></div>
        <span>Consultas frecuentes en horario</span>
      </div>
      <div class="feat flex items-center gap-sm">
        <div class="switch off"><i></i></div>
        <span>Cotizaciones y ordenes</span>
      </div>
    </div>
    <div class="section text-sm font-bold text-muted">Siempre escala a humano</div>
    <div class="list">
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">Queja detectada</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">Cliente VIP</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">Monto mayor a umbral</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">Solicitud legal</span></div>
      <div class="row flex items-center gap px-lg py-sm"><span class="text-sm">El cliente pide hablar con una persona</span></div>
    </div>
  </div>`;
}