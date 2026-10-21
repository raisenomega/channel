/**
 * HUB by Raisen — Sección "Gráficas" del Panel (SOT: docs/DASHBOARD_PANEL_SOT.md). UN contenedor
 * full-width (bento-col-12) con las 4 gráficas en una línea, cada una con su leyenda debajo:
 * Rendimiento de ventas (barras) · Mensajes consumidos (líneas) · Rendimiento de agentes (líneas) ·
 * Uso por canal (circular). Cero-mocks: sólo "Uso por canal" tiene dato real hoy; el resto muestra
 * su estado vacío honesto hasta que exista su endpoint. No cambia estilos/tamaños de card. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ChartCell, EmptyChart } from "./chart-kit";
import { GraficaUsoCanal } from "./grafica-uso-canal";
import { GraficaConsumo } from "./grafica-consumo";

export function GraficasPanel({ lang, porCanal }: {
  lang: Idioma;
  porCanal: Record<string, number>;
}) {
  const vacio = t(lang, "dash.chart.sinDatos");
  return (
    <div className="bento mt-4">
      <div className="bento-card bento-col-12">
        <div className="bento-title">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 17V3M3 17h14M7 14V9M11 14V6M15 14v-3" />
          </svg>
          <span>{t(lang, "dash.graficas")}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <ChartCell title={t(lang, "dash.chart.ventas")}><EmptyChart label={vacio} /></ChartCell>
          <ChartCell title={t(lang, "dash.chart.mensajes")}><GraficaConsumo lang={lang} /></ChartCell>
          <ChartCell title={t(lang, "dash.chart.agentes")}><EmptyChart label={vacio} /></ChartCell>
          <ChartCell title={t(lang, "dash.chart.usoCanal")}><GraficaUsoCanal lang={lang} porCanal={porCanal} /></ChartCell>
        </div>
      </div>
    </div>
  );
}
