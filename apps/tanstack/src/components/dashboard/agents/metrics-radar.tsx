/**
 * HUB by Raisen — P3 JARVIS: radar del perfil del agente (sus dimensiones). recharts. C4 <=75.
 */
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export function MetricsRadar({ data, accent }: { data: Array<{ k: string; v: number }>; accent: string }) {
  const color = `hsl(${accent})`;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data} outerRadius="68%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="k" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
        <Radar dataKey="v" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.35} isAnimationActive animationDuration={900} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
