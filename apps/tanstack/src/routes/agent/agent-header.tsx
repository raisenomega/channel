/**
 * HUB by Raisen — Encabezado de la página Agente IA.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { AgentMetrics } from "@/lib/types";

export function AgentHeader({ language, metrics, hasError }: {
  language: Idioma;
  metrics: AgentMetrics | null;
  hasError: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{t(language, "agent.title")}</h2>
        {metrics && !hasError ? (
          <span className="block text-xs text-muted-foreground">
            {t(language, "agent.providerLine")}: {metrics.providerName} · {t(language, "agent.model")}: {metrics.modelName}
            · {metrics.totalInteractions} interacciones
          </span>
        ) : null}
      </div>
    </div>
  );
}