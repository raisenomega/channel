/**
 * HUB by Raisen — Bento Card: Estado de agentes IA. Status REAL via useAgentStatus (polling 10s a
 * /tenants/:id/agents/status); sin tenant/datos -> fallback honesto (todos en standby). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useAgentStatus } from "@/hooks/useAgentStatus";

export function BentoEstadoAgentes({ lang }: { lang: Idioma }) {
  const { agents } = useAgentStatus();
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="7" r="3" /><path d="M3 18c0-3 3-6 7-6s7 3 7 6" />
        </svg>
        <span>{t(lang, "dash.estadoAgentes")}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {agents.map((a) => (
          <div key={a.name} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: a.online ? "hsl(var(--success))" : "hsl(var(--text-dim))" }} />
            <span className="w-14 shrink-0 font-semibold text-foreground">{t(lang, "agent.name." + a.name)}</span>
            <span className="truncate text-muted-foreground">{a.online ? t(lang, "agent.status.online") : t(lang, "agent.status.standby")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
