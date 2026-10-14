/**
 * HUB by Raisen — Pagina de configuracion (/settings).
 * Datos reales desde la sesion del usuario (email, tenant, plan).
 * Preferencias locales (idioma, tema) con toggle de white-label.
 * Enlace a cumplimiento legal (/settings/legal).
 * Sin datos mock (N5). i18n completo.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { readLocalSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { datosDeSesion } from "./settings-ui/session-utils";
import { AccountCard } from "./settings-ui/account-card";
import { PreferencesCard } from "./settings-ui/preferences-card";
import { LegalLinkCard } from "./settings-ui/legal-link-card";

export const SettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

function SettingsPage() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const nextLang = language === "es" ? "en" : "es";
  const session = readLocalSession();
  const { email, tenant, plan } = datosDeSesion(session);
  const whiteLabel = localStorage.getItem("hub.whiteLabel") === "true";

  function toggleWhiteLabel() {
    const next = !whiteLabel;
    localStorage.setItem("hub.whiteLabel", String(next));
    window.location.assign(window.location.href);
  }

  return (
    <div className="view space-y-4">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "settings.account")}
      </h2>
      <AccountCard language={language} email={email} tenant={tenant} plan={plan} />

      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "settings.preferences")}
      </h2>
      <PreferencesCard
        language={language} theme={theme} nextLang={nextLang} whiteLabel={whiteLabel}
        onToggleLang={() => setLanguage(nextLang)}
        onToggleTheme={toggleTheme}
        onToggleWhiteLabel={toggleWhiteLabel}
      />

      <LegalLinkCard language={language} />
    </div>
  );
}