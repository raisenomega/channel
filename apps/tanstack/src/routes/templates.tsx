/**
 * HUB by Raisen — Ruta /templates (Slide 4.9). Dos tabs: Mis templates + Library.
 * Hotfix L-3: los tabs se renderizan SIEMPRE (con o sin tenant); sin tenant la
 * lista queda vacia con banner CTA, nunca un redirect al wizard.
 * C4 <=75.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { NeedTenantBanner } from "@/components/ui/need-tenant-banner";
import { useTemplates } from "./templates-ui/templates-fetchers";
import { TemplatesList } from "./templates-ui/templates-list";
import { TemplateCreateForm } from "./templates-ui/template-create-form";
import { LibraryImport } from "./templates-ui/library-import";

export const TemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/templates",
  component: TemplatesPage,
});

type TabKey = "mine" | "library";

function TemplatesPage() {
  const { language } = usePreferences();
  const [tab, setTab] = useState<TabKey>("mine");
  const query = useTemplates();
  const vista = query.data;

  return (
    <div className="view">
      <h2 className="mb-1 text-lg font-bold text-foreground">{t(language, "templates.title")}</h2>
      <div className="flex gap-2 mb-3" data-testid="templates-tabs">
        <Button variant={tab === "mine" ? "primary" : "ghost"} size="sm"
          onClick={() => setTab("mine")}>
          {t(language, "templates.tab.mine")}
        </Button>
        <Button variant={tab === "library" ? "primary" : "ghost"} size="sm"
          onClick={() => setTab("library")}>
          {t(language, "templates.tab.library")}
        </Button>
      </div>

      {vista?.needTenant ? <NeedTenantBanner language={language} prefijo="templates" /> : null}
      {vista?.fallo ? (
        <div className="mb-4 rounded-2xl glass-card p-4 text-sm text-critical" data-testid="templates-error">
          {t(language, "templates.error")}
        </div>
      ) : null}

      {query.isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "templates.loading")}
        </div>
      ) : tab === "mine" ? (
        <>
          <TemplatesList language={language} templates={vista?.templates ?? []} syncFailed={vista?.syncFailed ?? false} />
          <div className="mt-4">
            <TemplateCreateForm language={language} onCreated={() => void query.refetch()} />
          </div>
        </>
      ) : (
        <LibraryImport language={language} onImported={() => void query.refetch()} />
      )}
    </div>
  );
}
