/**
 * HUB by Raisen — Gráfica "Uso por canal" (dona, dato REAL de stats.porCanal). Cero-mocks: si no
 * hay conversaciones todavía -> estado vacío honesto. Colores futuristas de FUTURE_COLORS. C4 <=75.
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={60} paddingAngle={3} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={FUTURE_COLORS[i % FUTURE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(var(--bg))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
