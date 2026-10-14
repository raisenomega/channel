import { useState } from "react";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { optInAI } from "@/lib/settings-client";
import type { PrivacyConfig } from "@/lib/settings-client";
import { formatDate } from "./legal-utils";

export function AiDisclosurePanel({
  language, config, onRefetch,
}: {
  language: "es" | "en";
  config: PrivacyConfig;
  onRefetch: () => void;
}) {
  const [optInLoading, setOptInLoading] = useState(false);
  const [optInError, setOptInError] = useState<string | null>(null);

  async function handleOptIn(accepted: boolean) {
    setOptInLoading(true);
    setOptInError(null);
    const result = await optInAI(accepted);
    setOptInLoading(false);
    if (!result.ok) {
      setOptInError(result.error.message ?? t(language, "common.error"));
      return;
    }
    onRefetch();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "legal.aiDisclosure")}</CardTitle>
        {config.ai_disclosure_accepted ? (
          <Badge tone="success">{t(language, "legal.consentGranted")}</Badge>
        ) : (
          <Badge tone="warn">{t(language, "legal.consentRevoked")}</Badge>
        )}
      </CardHeader>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          {t(language, "legal.aiDisclosureBody")}
        </p>
        <div className="feat flex items-center justify-between mt-2">
          <div>
            <span className="text-sm text-muted-foreground">{t(language, "legal.aiOptIn")}</span>
            <p className="text-[11px] text-dim">{t(language, "legal.aiOptInHint")}</p>
          </div>
          <Switch
            checked={config.ai_disclosure_accepted}
            disabled={optInLoading}
            onChange={handleOptIn}
          />
        </div>
        {optInError ? (
          <p className="text-sm text-critical mt-1" role="alert">{optInError}</p>
        ) : null}
        {config.ai_disclosure_accepted_at ? (
          <p className="text-[11px] text-dim mt-1">
            {t(language, "legal.privacyUpdated", { date: formatDate(config.ai_disclosure_accepted_at, language) })}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}