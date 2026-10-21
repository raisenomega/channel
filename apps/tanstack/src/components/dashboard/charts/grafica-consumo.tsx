/**
 * HUB by Raisen — Gráfica "Mensajes consumidos" DOBLE: Mensajes + Llamadas, en la MISMA gráfica.
 * Dato REAL: mensajes = totalMessages de reportes; llamadas = 0 HONESTO (aún sin fuente de llamadas).
 * Cuando exista la fuente de llamadas, su barra crece sola (cero-mocks). C4 <=75.
 */
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchReportKpis } from "@/lib/reports-client";
import { FUTURE_COLORS, EmptyChart } from "./chart-kit";

export function GraficaConsumo({ lang }: { lang: Idioma }) {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const r = await fetchReportKpis();
      return r.ok ? r.value : null;
    },
    staleTime: 30_000,
  });
  const mensajes = data?.totalMessages ?? 0;
  const llamadas = 0; // honesto: aún no hay fuente de llamadas (cero REAL; misma gráfica cuando exista)
  if (mensajes === 0 && llamadas === 0) return <EmptyChart label={t(lang, "dash.chart.sinDatos")} />;
  const rows = [
    { name: t(lang, "dash.consumo.mensajes"), value: mensajes, c: FUTURE_COLORS[0] },
    { name: t(lang, "dash.consumo.llamadas"), value: llamadas, c: FUTURE_COLORS[2] },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 16, right: 10, left: 10, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {rows.map((r, i) => <Cell key={i} fill={r.c} />)}
          <LabelList dataKey="value" position="top" style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
