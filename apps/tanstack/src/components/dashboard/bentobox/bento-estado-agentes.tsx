/**
 * HUB by Raisen — Bento Card: Estado agentes IA (7 agentes con status).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const AGENTES = ["victor","zahra","thao","iris","eco","angel","kelsy"] as const;

const STATUS: Record<string, boolean> = {
  victor: true, zahra: true, thao: true,
  iris: false, eco: true, angel: false, kelsy: true,
};

export function BentoEstadoAgentes({ lang }: { lang: Idioma }) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="7" r="3" /><path d="M3 18c0-3 3-6 7-6s7 3 7 6" />
        </svg>
        <span>{t(lang, "dash.estadoAgentes")}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {AGENTES.map((a) => {
          const online = STATUS[a];
          return (
            <div key={a} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ background: online ? "hsl(var(--success))" : "hsl(var(--text-dim))" }}
              />
              <span className="font-semibold text-foreground w-14 shrink-0">
                {t(lang, "agent.name." + a)}
              </span>
              <span className="text-muted-foreground truncate">
                {online ? t(lang, "agent.status.online") : t(lang, "agent.status.standby")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}