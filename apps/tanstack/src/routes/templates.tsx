/**
 * HUB by Raisen — Ruta /templates (Slide 4.9). Dos tabs: Mis templates + Library.
 * C4 <=75. Usa useState para tab activo + useQuery para carga.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { useQuery } from "@tanstack/react-query";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { listarTemplates } from "@/lib/templates-client/functions";
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

  const query = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const r = await listarTemplates();
      if (!r.ok) {
        if (r.error.kind === "config_incompleta" && typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return { templates: [], syncFailed: false };
      }
      return r.value;
    },
    staleTime: 10_000,
  });

  return (
    <div className="view">
      <h2 className="mb-1 text-lg font-bold text-foreground">{t(language, "templates.title")}</h2>
      <div className="flex gap-2 mb-3">
        <Button variant={tab === "mine" ? "primary" : "ghost"} size="sm"
          onClick={() => setTab("mine")}>
          {t(language, "templates.tab.mine")}
        </Button>
        <Button variant={tab === "library" ? "primary" : "ghost"} size="sm"
          onClick={() => setTab("library")}>
          {t(language, "templates.tab.library")}
        </Button>
      </div>

      {query.isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "templates.loading")}
        </div>
      ) : tab === "mine" ? (
        <>
          <TemplatesList language={language} templates={query.data?.templates ?? []} syncFailed={query.data?.syncFailed ?? false} />
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