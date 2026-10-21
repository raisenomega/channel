/**
 * HUB by Raisen — Gráfica "Uso por canal" (dona + LEYENDA escrita, estilo tarjeta Cumplimiento SLA).
 * Dato REAL de stats.porCanal. Cero-mocks: si no hay conversaciones -> estado vacío honesto.
 * Leyenda SIEMPRE visible (punto de color + canal + valor), no tooltip transparente. C4 <=75.
 */
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { FUTURE_COLORS, EmptyChart } from "./chart-kit";

export function GraficaUsoCanal({ lang, porCanal }: {
  lang: Idioma;
  porCanal: Record<string, number>;
}) {
  const data = Object.entries(porCanal)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);
  if (data.length === 0) return <EmptyChart label={t(lang, "dash.chart.sinDatos")} />;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex h-full items-center gap-3">
      <div className="relative h-full w-[45%] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={52} paddingAngle={3} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={FUTURE_COLORS[i % FUTURE_COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{total}</span>
      </div>
      <ul className="flex flex-1 flex-col gap-1 text-[11px]">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: FUTURE_COLORS[i % FUTURE_COLORS.length] }} />
            <span className="truncate text-muted-foreground">{t(lang, "canal." + d.name)}</span>
            <span className="ml-auto font-semibold text-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
