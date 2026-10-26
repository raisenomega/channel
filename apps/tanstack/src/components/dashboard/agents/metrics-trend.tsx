/**
 * HUB by Raisen — P3 JARVIS: area de tendencia (actividad por dia, 14d) animada. recharts. C4 <=75.
 */
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export function MetricsTrend({ data, accent, label }: { data: Array<{ day: string; v: number }>; accent: string; label: string }) {
  const color = `hsl(${accent})`;
  const gid = "grad" + accent.replace(/[^a-z0-9]/gi, "");
  return (
    <div className="rounded-xl border border-border/40 bg-card-soft p-3">
      <p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.5} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={2} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
