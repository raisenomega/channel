/**
 * HUB by Raisen — Lista de plantillas WhatsApp (Slide 4.9).
 * C4 <=75. Renderiza cada template con nombre, lenguaje, categoria, badge y vista previa.
 */
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n";
import type { WhatsAppTemplate } from "@/lib/templates-client/types";
import { TemplateStatusBadge } from "./template-status-badge";

export function TemplatesList({ language, templates, syncFailed }: {
  language: Idioma;
  templates: readonly WhatsAppTemplate[];
  syncFailed: boolean;
}) {
  return (
    <div>
      {syncFailed ? (
        <div className="mb-2 rounded-2xl glass-card px-4 py-3 text-sm text-muted-foreground">
          ⚠ {t(language, "templates.syncFailed")}
        </div>
      ) : null}

      {templates.length === 0 ? (
        <div className="rounded-2xl glass-card p-4 text-sm text-muted-foreground">
          {t(language, "templates.empty")} {t(language, "templates.emptyBody")}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-2xl glass-card px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1">
                <strong className="text-sm">{tpl.name}</strong>
                <span className="block text-xs text-muted-foreground">
                  {tpl.language} · {tpl.category}
                </span>
              </div>
              <TemplateStatusBadge language={language} status={tpl.status} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {tpl.body.length > 120 ? tpl.body.slice(0, 117) + "…" : tpl.body}
            </div>
            {tpl.rejection_reason ? (
              <div className="mt-1 text-xs text-critical">{tpl.rejection_reason}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}