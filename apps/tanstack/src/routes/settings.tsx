import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const SettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

function SettingsPage() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const nextLang = language === "es" ? "en" : "es";

  return (
    <div className="view">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "settings.account")}
      </h2>

      <Card>
        <CardBody>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.email")}</span>
            <span className="text-sm font-medium text-foreground">admin@empresa.com</span>
          </div>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.tenant")}</span>
            <span className="text-sm font-medium text-foreground">Raisen Corp</span>
          </div>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.plan")}</span>
            <span className="text-sm font-medium text-foreground">Ecosystem</span>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t(language, "settings.preferences")}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.language")}</span>
            <button
              type="button"
              className="nav-tool"
              onClick={() => setLanguage(nextLang)}
            >
              {nextLang === "en" ? "ES" : "EN"}
            </button>
          </div>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.theme")}</span>
            <button
              type="button"
              className="nav-tool"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
          <div className="feat flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(language, "settings.whiteLabel")}</span>
            <Switch />
          </div>
          <div className="feat mt-2">
            <Link to="/settings/legal" className="text-sm text-primary hover:text-primary-hover">
              {t(language, "legal.title")}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}