import { useMemo } from "react";
import type { InboxItem, DashboardStats } from "@/lib/types";
import { t, type Idioma } from "@/lib/i18n";

/* ===== KPIs vitals (glass glow) ===== */

export function BentoKpi({
  label, num, unit, trend, down,
}: {
  label: string; num: string | number; unit?: string; trend?: string; down?: boolean;
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">{label}</div>
      <div className="bento-stat">
        <div className="num">
          {num}
          {unit ? <small>{unit}</small> : null}
        </div>
        {trend ? <div className={"trend" + (down ? " down" : "")}>{trend}</div> : null}
      </div>
    </div>
  );
}

/* ===== Título de sección / encabezado ===== */

export function BentoTitle({ icon, label, right }: {
  icon: React.ReactNode; label: string; right?: React.ReactNode;
}) {
  return (
    <div className="bento-title">
      <span className="ico">{icon}</span>
      <span>{label}</span>
      {right ? <span className="ml-auto">{right}</span> : null}
    </div>
  );
}

/* ===== Distribución por canal (gráfica de barras custom, sin recharts externo) ===== */

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
            <div
              className="h-full rounded-full"
              style={{
                width: ancho(e.n) + "%",
                background: "linear-gradient(90deg, hsl(var(--hub-deep)), hsl(var(--primary)))",
                boxShadow: "0 0 10px hsl(var(--primary) / .5)",
              }}
            />
          </div>
          <span className="w-6 text-right text-xs font-bold text-foreground">{e.n}</span>
        </div>
      ))}
    </div>
  );
}

/* ===== Reloj de estados / SLA (donut custom con conic-gradient) ===== */

export function AnilloSLA({ items, lang }: {
  items: readonly InboxItem[]; lang: Idioma;
}) {
  const total = items.length;
  const sla = items.filter((i) => i.slaViolated).length;
  const pct = total ? Math.round((sla / total) * 100) : 0;
  const txt = total ? t(lang, "dash.slaCumplido") : t(lang, "inbox.empty");

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-24 w-24 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--success)) ${100 - pct}%, hsl(var(--medium)) ${100 - pct}% 100%)`,
          boxShadow: "0 0 22px hsl(var(--success) / .35)",
        }}
      >
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-card text-center">
          <div>
            <div className="text-lg font-extrabold text-foreground">{100 - pct}%</div>
            <div className="text-[10px] text-dim">{t(lang, "dash.slaOk")}</div>
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(var(--success))" }} />
          <span className="text-muted-foreground">{t(lang, "dash.slaOk")}</span>
          <b className="ml-auto text-foreground">{total - sla}</b>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(var(--medium))" }} />
          <span className="text-muted-foreground">{t(lang, "dash.slaVendido")}</span>
          <b className="ml-auto text-foreground">{sla}</b>
        </div>
      </div>
      <p className="sr-only">{txt}</p>
    </div>
  );
}

/* ===== Pendientes (derivados reales) ===== */

export function Pendientes({ items, lang }: {
  items: readonly InboxItem[]; lang: Idioma;
}) {
  const sinAsignar = items.filter((i) => !i.assignedTo).length;
  const sla = items.filter((i) => i.slaViolated).length;
  const abiertas = items.filter((i) => i.status === "open").length;

  return (
    <ul className="bento-pending">
      <li>
        <span className="dotx from-zernio" />
        <div className="tx">
          <b>{t(lang, "dash.pend.asignar")}</b>
          <span>{sinAsignar} {t(lang, "inbox.total")}</span>
        </div>
      </li>
      <li>
        <span className="dotx to-send" />
        <div className="tx">
          <b>{t(lang, "dash.pend.seguimiento")}</b>
          <span>{abiertas} {t(lang, "inbox.active")}</span>
        </div>
      </li>
      <li>
        <span className="dotx sla-risk" />
        <div className="tx">
          <b>{t(lang, "dash.pend.sla")}</b>
          <span>{sla} {t(lang, "inbox.filtros")}</span>
        </div>
      </li>
      <li>
        <span className="dotx vip" />
        <div className="tx">
          <b>{t(lang, "dash.pend.autonomia")}</b>
          <span>{t(lang, "dash.agents")}</span>
        </div>
      </li>
    </ul>
  );
}