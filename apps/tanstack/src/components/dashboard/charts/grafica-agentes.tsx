/**
 * HUB by Raisen — Grafica "Rendimiento de agentes" (Dashboard): actividad REAL de los agentes por dia (14d)
 * desde las metricas. Vacio honesto si no hay actividad. recharts, animada. C4 <=75.
 */
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import type { Idioma } from "@/lib/i18n";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";
import { EmptyChart } from "./chart-kit";

export function GraficaAgentes({ vacio }: { lang: Idioma; vacio: string }) {
  const { serie } = useAgentMetrics();
  const data = serie.map((s) => ({ day: s.day, v: Object.values(s.counts).reduce((x, y) => x + y, 0) }));
  if (data.every((d) => d.v === 0)) return <EmptyChart label={vacio} />;
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -26, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={3} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
        <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
}
