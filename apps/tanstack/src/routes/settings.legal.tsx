import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";

export const LegalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/legal",
  component: LegalPage,
});

function LegalPage() {
  const { language } = usePreferences();

  return (
    <div className="view">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "legal.title")}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>{t(language, "legal.privacyNotice")}</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            {t(language, "legal.aiDisclosure")}
          </p>
          <p className="text-xs text-dim">
            {t(language, "legal.termsOfService")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
