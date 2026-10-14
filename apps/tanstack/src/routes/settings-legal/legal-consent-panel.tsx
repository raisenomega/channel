import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "./legal-utils";
import type { ConsentLogEntry } from "@/lib/settings-client";

export function ConsentLogPanel({
  language, consentLog,
}: {
  language: "es" | "en";
  consentLog: readonly ConsentLogEntry[];
}) {
  const sinConsent = consentLog.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "legal.consentTitle")}</CardTitle>
        {sinConsent ? null : (
          <Badge tone="hub">{String(consentLog.length)}</Badge>
        )}
      </CardHeader>
      <CardBody>
        {sinConsent ? (
          <div className="text-center py-4">
            <p className="text-sm text-dim italic">
              {t(language, "legal.consentNone")}
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {consentLog.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="feat flex items-center justify-between py-1 px-1 rounded-lg bg-card-soft/60 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    tone={entry.granted ? "success" : "danger"}
                    dot
                  >
                    {entry.granted
                      ? t(language, "legal.consentGranted")
                      : t(language, "legal.consentRevoked")}
                  </Badge>
                  <span className="text-xs font-mono text-dim truncate max-w-[120px]">
                    {entry.contact_id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-dim">
                    {entry.consent_type}
                  </span>
                  <span className="text-[11px] text-dim">
                    {formatDate(entry.granted_at, language)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}