/**
 * HUB by Raisen — S-7/S-8/S-9: overlay FULLSCREEN one-shot del onboarding completo. Header con
 * chip de plan readonly (#99), banner de recomendación amigable (#102, icono SVG — sin emoji),
 * cuerpo scrollable (barra principal + 3 cards) y footer a la derecha: 1 botón primario
 * "Crear mi negocio" (#96 atómico) + Cancelar. Al guardar OK -> onDone cierra el overlay. C4 <=75.
 */
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { OnboardingForm } from "@/lib/tenant-client/onboarding-fields";
import { useOnboardingForm } from "./use-onboarding-form";
import { OnboardingMainFields } from "./onboarding-main-fields";
import { OnboardingCards } from "./onboarding-cards";

const Bulb = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c.5.5 1 1.5 1 2h6c0-.5.5-1.5 1-2a7 7 0 0 0-4-12Z" />
  </svg>
);

export function OnboardingOverlay({ language, mode, email, plan, tenantId, initial, onClose, onDone }: {
  language: Idioma;
  mode: "create" | "edit";
  email: string;
  plan: string;
  tenantId?: string;
  initial?: Partial<OnboardingForm>;
  onClose: () => void;
  onDone: () => void;
}) {
  const { form, setField, submit, busy, err } = useOnboardingForm({ mode, tenantId, email, initial, onDone });
  return (
    <div data-testid="onboarding-overlay" className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <h2 className="text-base font-bold">{t(language, mode === "create" ? "onboarding.title" : "onboarding.editTitle")}</h2>
        <span data-testid="onb-plan" className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {t(language, "onboarding.planActive")}: {plan || "esencial"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <div data-testid="onb-recommend" className="flex items-start gap-2 rounded-xl glass-card p-3 text-xs leading-relaxed text-muted-foreground">
            <Bulb />{t(language, "onboarding.recommend")}
          </div>
          {err ? <p data-testid="onb-error" className="text-xs text-critical">{t(language, err)}</p> : null}
          <OnboardingMainFields form={form} setField={setField} language={language} email={email} />
          <OnboardingCards form={form} setField={setField} language={language} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border/40 px-5 py-3">
        <Button variant="outline" onClick={onClose}>{t(language, "onboarding.cancel")}</Button>
        <Button data-testid="onb-submit" variant="primary" disabled={busy} onClick={() => void submit()}>
          {busy ? t(language, "onboarding.saving") : t(language, mode === "create" ? "onboarding.create" : "registro.save")}
        </Button>
      </div>
    </div>
  );
}
