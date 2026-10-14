/**
 * HUB by Raisen — Vista de cumplimiento legal (/settings/legal).
 * Datos reales desde Supabase REST (privacy_config, consent_log).
 * Si no hay datos configurados, estado vacío honesto (N5). i18n completo.
 */
import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t, type Idioma } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getPrivacyConfig, getConsentLog, optInAI } from "@/lib/settings-client";
import type { PrivacyConfig, Result, ConsentLogEntry } from "@/lib/settings-client";

export const LegalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/legal",
  component: LegalPage,
});

// ── Render helpers ───────────────────────────────────────────

function formatDate(iso: string | null, lang: Idioma): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es" : "en", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "—";
  }
}

// ── Página principal ─────────────────────────────────────────

function LegalPage() {
  const { language } = usePreferences();

  // Consulta real a Supabase REST
  const privacyQuery = useQuery({
    queryKey: ["privacy_config"],
    queryFn: getPrivacyConfig,
    staleTime: 60_000,
  });

  const consentQuery = useQuery({
    queryKey: ["consent_log"],
    queryFn: getConsentLog,
    staleTime: 60_000,
  });

  const privacyData = privacyQuery.data as Result<PrivacyConfig, Error> | undefined;
  const consentData = consentQuery.data as Result<ConsentLogEntry[], Error> | undefined;

  // Extraer valores seguros
  const config: PrivacyConfig = privacyData?.ok === true
    ? privacyData.value
    : {
        ai_disclosure_accepted: false,
        ai_disclosure_accepted_at: null,
        privacy_policy_version: null,
        tos_version: null,
        data_retention_days: null,
        updated_at: null,
      };

  const consentLog: ConsentLogEntry[] = consentData?.ok === true
    ? consentData.value
    : [];

  const sinConsent = consentLog.length === 0;

  // ── Opt-in toggle ────────────────────────────────────
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
    // Refrescar la query para reflejar el cambio
    privacyQuery.refetch();
  }

  return (
    <div className="view space-y-4">
      {/* Navegación */}
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t(language, "common.back")}
      </Link>

      <h2 className="text-lg font-bold text-foreground">
        {t(language, "legal.title")}
      </h2>

      {/* ── Card: Términos del servicio ─────────────────── */}
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

      {/* ── Card: Aviso de privacidad ───────────────────── */}
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
              Política de privacidad versión {config.privacy_policy_version}.
              {config.data_retention_days
                ? ` Retención de datos: ${config.data_retention_days} días.`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-dim italic">{t(language, "legal.privacyConfigEmpty")}</p>
          )}
        </CardBody>
      </Card>

      {/* ── Card: Divulgación IA (SB-1001) ──────────────── */}
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

      {/* ── Card: Registro de consentimiento ────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>{t(language, "legal.consentTitle")}</CardTitle>
          {sinConsent ? null : (
            <Badge tone="hub">{String(consentLog.length)}</Badge>
          )}
        </CardHeader>
        <CardBody>
          {sinConsent ? (
            // Estado vacío honesto (N5)
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

      {/* ── Nota legal ──────────────────────────────────── */}
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
    </div>
  );
}