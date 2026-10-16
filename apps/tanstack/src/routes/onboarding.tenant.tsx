/**
 * HUB by Raisen — Route page /onboarding/tenant (full-page tenant creation).
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { TenantWizardShell } from "@/components/dashboard/onboarding/tenant-wizard-shell";

export const OnboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding/tenant",
  component: OnboardingPage,
});

function OnboardingPage() {
  const { language } = usePreferences();
  return <TenantWizardShell lang={language} />;
}