/**
 * HUB by Raisen — Página de configuración (/settings).
 * Datos reales desde la sesión del usuario (email, tenant, plan).
 * Preferencias locales (idioma, tema) con toggle de white-label.
 * Enlace a cumplimiento legal (/settings/legal).
 * Sin datos mock (N5). i18n completo.
 */
import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { readLocalSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Session } from "@supabase/supabase-js";

export const SettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

// ── Extraer datos del contexto real del usuario ──────────────

function datosDeSesion(session: Session | null): {
  email: string;
  tenant: string;
  plan: string;
} {
  if (!session?.user?.email) {
    return { email: "—", tenant: "—", plan: "—" };
  }
  const meta = session.user.user_metadata ?? {};
  // user_metadata suele llevar tenant_name y plan del tenant
  const tenant: string =
    (meta.tenant_name as string | undefined) ??
    (meta.tenant as string | undefined) ??
    "—";
  const plan: string =
    (meta.plan as string | undefined) ??
    (meta.tenant_plan as string | undefined) ??
    "Ecosystem";
  return {
    email: session.user.email,
    tenant,
    plan,
  };
}

// ── Componente principal ─────────────────────────────────────

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    // Sol (cambiar a tema claro)
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  // Luna (cambiar a tema oscuro)
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SettingsPage() {
  const { language, theme, toggleTheme, setLanguage } = usePreferences();
  const nextLang = language === "es" ? "en" : "es";

  // Datos reales de la sesión autenticada
  const session = readLocalSession();
  const { email, tenant, plan } = datosDeSesion(session);

  // White-label: se persiste en localStorage como preferencia local
  const whiteLabelRaw = localStorage.getItem("hub.whiteLabel");
  const whiteLabel = whiteLabelRaw === "true";

  function toggleWhiteLabel() {
    const next = !whiteLabel;
    localStorage.setItem("hub.whiteLabel", String(next));
    window.location.assign(window.location.href);
  }

  return (
    <div className="view space-y-4">
      {/* ── Sección: Tu cuenta ────────────────────────── */}
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "settings.account")}
      </h2>

      <Card>
        <CardBody>
          <div className="feat flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t(language, "settings.email")}</span>
            <span className="text-sm font-mono text-foreground">{email}</span>
          </div>
          <div className="feat flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t(language, "settings.tenant")}</span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{tenant}</span>
              <Badge tone="hub" className="text-[10px]">{plan}</Badge>
            </span>
          </div>
          <div className="feat flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t(language, "settings.plan")}</span>
            <Badge tone="success">{plan}</Badge>
          </div>
        </CardBody>
      </Card>

      {/* ── Sección: Preferencias ─────────────────────── */}
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "settings.preferences")}
      </h2>

      <Card>
        <CardBody>
          {/* Idioma */}
          <div className="feat flex items-center justify-between py-1">
            <div>
              <span className="text-sm text-muted-foreground">{t(language, "settings.language")}</span>
              <p className="text-[11px] text-dim">{t(language, "settings.languageValue")}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(nextLang)}
            >
              {nextLang === "en" ? "EN" : "ES"}
            </Button>
          </div>

          {/* Tema */}
          <div className="feat flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t(language, "settings.theme")}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={t(language, "settings.theme")}
            >
              <ThemeIcon dark={theme === "dark"} />
            </Button>
          </div>

          {/* White-label */}
          <div className="feat flex items-center justify-between py-1">
            <div>
              <span className="text-sm text-muted-foreground">{t(language, "settings.whiteLabel")}</span>
              <p className="text-[11px] text-dim">{t(language, "settings.whiteLabelHint")}</p>
            </div>
            <Switch checked={whiteLabel} onChange={toggleWhiteLabel} />
          </div>
        </CardBody>
      </Card>

      {/* ── Enlace a cumplimiento legal ───────────────── */}
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>{t(language, "legal.title")}</CardTitle>
          <Badge tone="warn">{t(language, "common.noData")}</Badge>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            {t(language, "legal.privacyNotice")} · {t(language, "legal.aiDisclosure")} · {t(language, "legal.termsOfService")}
          </p>
          <Link
            to="/settings/legal"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover mt-2"
          >
            {t(language, "legal.title")} →
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}