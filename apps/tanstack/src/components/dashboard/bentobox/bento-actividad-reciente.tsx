/**
 * HUB by Raisen — Bento Card: Actividad reciente (últimos 5 eventos).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export interface ActivityEvent {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly timestamp: string;
}

export function BentoActividadReciente({ lang, events }: {
  lang: Idioma;
  events: readonly ActivityEvent[];
}) {
  return (
    <div className="bento-card bento-col-6">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="7" /><polyline points="10,5 10,10 14,12" />
        </svg>
        <span>{t(lang, "dash.actividadReciente")}</span>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t(lang, "dash.sinActividad")}</p>
      ) : (
        <ul className="flex flex-col">
          {events.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-start gap-2 border-b border-border/20 py-1.5 last:border-0">
              <Dot type={e.type} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{e.label}</p>
                <p className="text-[10px] text-dim">{e.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dot({ type }: { type: string }) {
  const hue = type === "tenant_created" ? "var(--success)"
    : type.startsWith("channel_connected") ? "var(--process)"
    : type === "message_received" ? "var(--primary)"
    : type.startsWith("draft_") ? "var(--high)"
    : "var(--text-dim)";
  return <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: `hsl(${hue})` }} />;
}