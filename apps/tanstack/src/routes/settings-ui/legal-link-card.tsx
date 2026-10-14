import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function LegalLinkCard({ language }: { language: "es" | "en" }) {
  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>{t(language, "legal.title")}</CardTitle>
        <Badge tone="warn">{t(language, "common.noData")}</Badge>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          {t(language, "legal.privacyNotice")} {"\u00B7"} {t(language, "legal.aiDisclosure")} {"\u00B7"} {t(language, "legal.termsOfService")}
        </p>
        <Link
          to="/settings/legal"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover mt-2"
        >
          {t(language, "legal.title")} {"\u2192"}
        </Link>
      </CardBody>
    </Card>
  );
}