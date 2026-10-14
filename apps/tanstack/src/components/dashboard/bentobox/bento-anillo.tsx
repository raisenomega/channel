import type { InboxItem } from "@/lib/types";
import { t, type Idioma } from "@/lib/i18n";

/* ===== Reloj de estados / SLA (donut con conic-gradient) ===== */

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