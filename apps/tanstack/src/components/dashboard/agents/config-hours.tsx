/**
 * HUB by Raisen — Horario configurable del modo autonomo: 24/7 (null) o dias + franja. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { AgentsHours } from "@/hooks/useAgentConfig";
import { ConfigToggle } from "./config-toggle";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function ConfigHours({ lang, hours, onChange }: { lang: Idioma; hours: AgentsHours | null; onChange: (h: AgentsHours | null) => void }) {
  const h = hours ?? { days: [0, 1, 2, 3, 4], start: "08:00", end: "18:00" };
  return (
    <div>
      <ConfigToggle label={t(lang, "cfg.customHours")} on={hours !== null} onToggle={() => onChange(hours ? null : h)} accent="35 90% 55%" />
      {hours !== null ? (
        <div className="mt-1 space-y-1">
          <div className="flex gap-1">{DAYS.map((d, i) => <button key={i} type="button" onClick={() => onChange({ ...h, days: h.days.includes(i) ? h.days.filter((x) => x !== i) : [...h.days, i] })} className="h-5 w-5 rounded text-[9px] font-bold text-white" style={{ background: h.days.includes(i) ? "hsl(var(--success))" : "hsl(var(--border))" }}>{d}</button>)}</div>
          <div className="flex items-center gap-1"><input type="time" value={h.start} onChange={(e) => onChange({ ...h, start: e.target.value })} className="rounded border border-border/55 bg-card-soft p-0.5 text-foreground" /><span>-</span><input type="time" value={h.end} onChange={(e) => onChange({ ...h, end: e.target.value })} className="rounded border border-border/55 bg-card-soft p-0.5 text-foreground" /></div>
        </div>
      ) : null}
    </div>
  );
}
