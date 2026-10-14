import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "./legal-utils";
import type { PrivacyConfig } from "@/lib/settings-client";

export function TosCard({ config, language }: { config: PrivacyConfig; language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "legal.tosTitle")}</CardTitle>
        {config.tos_version ? (
          <Badge tone="hub">v{config.tos_version}</Badge>
        ) : (
          <Badge tone="warn">{t(language, "common.noData")}</Badge>
        )}
      </CardHeader>
      <CardBody>
        {config.tos_version ? (
          <p className="text-sm text-muted-foreground">{t(language, "legal.tosBody")}</p>
        ) : (
          <p className="text-sm text-dim italic">{t(language, "legal.privacyConfigEmpty")}</p>
        )}
        {config.updated_at ? (
          <p className="text-[11px] text-dim mt-1">
            {t(language, "legal.privacyUpdated", { date: formatDate(config.updated_at, language) })}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function PrivacyCard({ config, language }: { config: PrivacyConfig; language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "legal.privacyNotice")}</CardTitle>
        {config.privacy_policy_version ? (
          <Badge tone="hub">v{config.privacy_policy_version}</Badge>
        ) : (
          <Badge tone="warn">{t(language, "common.noData")}</Badge>
        )}
      </CardHeader>
      <CardBody>
        {config.privacy_policy_version ? (
          <p className="text-sm text-muted-foreground">
            Politica de privacidad version {config.privacy_policy_version}.
            {config.data_retention_days
              ? ` Retencion de datos: ${config.data_retention_days} dias.`
              : ""}
          </p>
        ) : (
          <p className="text-sm text-dim italic">{t(language, "legal.privacyConfigEmpty")}</p>
        )}
      </CardBody>
    </Card>
  );
}

export function LegalNoteCard({ language }: { language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "legal.legalNote")}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-dim">
          {t(language, "legal.legalNoteBody")}
        </p>
      </CardBody>
    </Card>
  );
}