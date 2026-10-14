import { useMemo } from "react";
import type { DashboardStats } from "@/lib/types";
import { t, type Idioma } from "@/lib/i18n";

/* ===== Distribución por canal (grafica de barras custom) ===== */

export function DistribucionCanales({ stats, lang }: {
  stats: DashboardStats; lang: Idioma;
}) {
  const canales = useMemo(() => {
    const entradas = Object.entries(stats.porCanal)
      .map(([c, n]) => ({ canal: c, n, label: t(lang, "canal." + c) }));
    const max = Math.max(1, ...entradas.map((e) => e.n));
    return { entradas, max };
  }, [stats, lang]);

  if (!canales.entradas.length) {
    return <p className="text-sm text-muted-foreground">{t(lang, "dash.emptyBody")}</p>;
  }

  const ancho = (n: number) => Math.round((n / canales.max) * 100);

  return (
    <div className="flex flex-col gap-2">
      {canales.entradas.map((e) => (
        <div key={e.canal} className="flex items-center gap-2">
          <span className="w-24 truncate text-xs text-muted-foreground">{e.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-soft">
            <div className="h-full rounded-full" style={{
              width: ancho(e.n) + "%",
              background: "linear-gradient(90deg, hsl(var(--hub-deep)), hsl(var(--primary)))",
              boxShadow: "0 0 10px hsl(var(--primary) / .5)",
            }} />
          </div>
          <span className="w-6 text-right text-xs font-bold text-foreground">{e.n}</span>
        </div>
      ))}
    </div>
  );
}