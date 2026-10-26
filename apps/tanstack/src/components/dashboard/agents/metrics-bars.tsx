/**
 * HUB by Raisen — P3 JARVIS: barras comparando a los agentes (centro de mando de Victor). recharts. C4 <=75.
 */
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";

export function MetricsBars({ data }: { data: Array<{ name: string; v: number; color: string }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
        <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
