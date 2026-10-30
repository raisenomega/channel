/**
 * HUB by Raisen — Grafica "Rendimiento de agentes" (Dashboard): UNA barra por agente. Alto = % de
 * INTERVENCION real (parte del total de actividad de cada agente, 14d, suma 100). Nombre abajo (eje X),
 * % en el lateral (eje Y). Color por agente. Vacio honesto si no hay actividad. recharts. C4 <=75.
 */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";
import { AGENTS } from "../agents/agent-roster";
import { EmptyChart } from "./chart-kit";

export function GraficaAgentes({ lang, vacio }: { lang: Idioma; vacio: string }) {
  const { agents } = useAgentMetrics();
  const totales = AGENTS.map((a) => ({ a, total: agents[a.code]?.total ?? 0 }));
  const suma = totales.reduce((s, x) => s + x.total, 0);
  if (suma === 0) return <EmptyChart label={vacio} />;
  const data = totales.map(({ a, total }) => ({ name: t(lang, "agent.name." + a.code).slice(0, 5), pct: Math.round((total / suma) * 100), color: `hsl(${a.accent})` }));
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} interval={0} />
        <YAxis unit="%" width={26} tick={{ fontSize: 8, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.2)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v}%`, t(lang, "am.intervencion")]} />
        <Bar dataKey="pct" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={800}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
