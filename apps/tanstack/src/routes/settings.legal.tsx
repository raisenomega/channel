/**
 * HUB by Raisen — Vista de cumplimiento legal (/settings/legal).
 * Datos reales desde Supabase REST (privacy_config, consent_log).
 * Si no hay datos configurados, estado vacio honesto (N5). i18n completo.
 */
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { usePrivacyConfig, useConsentLog, extractConfig, extractConsentLog } from "./settings-legal/legal-fetchers";
import { AiDisclosurePanel } from "./settings-legal/legal-ai-panel";
import { ConsentLogPanel } from "./settings-legal/legal-consent-panel";
import { TosCard, PrivacyCard, LegalNoteCard } from "./settings-legal/legal-info-cards";

export const LegalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/legal",
  component: LegalPage,
});

function LegalPage() {
  const { language } = usePreferences();
  const privacyQuery = usePrivacyConfig();
  const consentQuery = useConsentLog();
  const config = extractConfig(privacyQuery.data);
  const consentLog = extractConsentLog(consentQuery.data);

  return (
    <div className="view space-y-4">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {"\u2190"} {t(language, "common.back")}
      </Link>
      <h2 className="text-lg font-bold text-foreground">{t(language, "legal.title")}</h2>
      <TosCard config={config} language={language} />
      <PrivacyCard config={config} language={language} />
      <AiDisclosurePanel language={language} config={config} onRefetch={() => privacyQuery.refetch()} />
      <ConsentLogPanel language={language} consentLog={consentLog} />
      <LegalNoteCard language={language} />
    </div>
  );
}