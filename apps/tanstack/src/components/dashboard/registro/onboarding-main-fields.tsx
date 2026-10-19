/**
 * HUB by Raisen — S-2/S-3 + Z-2: módulo "Datos del negocio" (6 campos) como card, para la rejilla
 * 2x2 del overlay. email readonly precargado del auth (S-3, nunca editable). phone precargado. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { OnboardingForm } from "@/lib/tenant-client/onboarding-fields";
import { OnbField } from "./onboarding-field";

type Set = (k: keyof OnboardingForm, v: string) => void;

export function OnboardingMainFields({ form, setField, language, email }: {
  form: OnboardingForm; setField: Set; language: Idioma; email: string;
}) {
  const L = (k: string): string => t(language, k);
  return (
    <div data-testid="onb-card-negocio" className="rounded-2xl glass-card p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground">{L("onboard.subchips.basicos")}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OnbField label={L("onboarding.f.name")} value={form.name} onChange={(v) => setField("name", v)} testId="onb-name" />
        <OnbField label={L("onboarding.f.email")} value={email} readOnly testId="onb-email" />
        <OnbField label={L("onboarding.f.phone")} kind="tel" value={form.phone} onChange={(v) => setField("phone", v)} testId="onb-phone" />
        <OnbField label={L("onboarding.f.country")} kind="select" value={form.country_code} onChange={(v) => setField("country_code", v)}
          options={[{ value: "PR", label: "Puerto Rico" }, { value: "US", label: "Estados Unidos" }, { value: "DO", label: "Rep. Dominicana" }]} />
        <OnbField label={L("onboarding.f.timezone")} value={form.timezone} onChange={(v) => setField("timezone", v)} />
        <OnbField label={L("onboarding.f.language")} kind="select" value={form.default_language} onChange={(v) => setField("default_language", v)}
          options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]} />
      </div>
    </div>
  );
}
