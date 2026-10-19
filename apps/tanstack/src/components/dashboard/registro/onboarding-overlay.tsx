/**
 * HUB by Raisen — Overlay FULLSCREEN del onboarding (Z-2). Full-width (3 módulos por línea en los
 * hijos), header con logo WhatsApp + nombre del negocio (izq) + chip de plan y botón [X] cerrar
 * (der). Cuerpo scrollable (barra principal + 3 cards). Footer: "Crear/Guardar" habilitado solo con
 * los 4 campos obligatorios (nombre+email+teléfono+país) + Cancelar. Al guardar OK -> onDone. C4 <=75.
 */
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
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
  const { form, setField, submit, busy, err, valido } = useOnboardingForm({ mode, tenantId, email, initial, onDone });
  const titulo = form.name.trim() || t(language, mode === "create" ? "onboarding.title" : "onboarding.editTitle");
  return (
    <div data-testid="onboarding-overlay" className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <WhatsAppIcon size={20} />
          <h2 className="truncate text-base font-bold">{titulo}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span data-testid="onb-plan" className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {t(language, "onboarding.planActive")}: {plan || "esencial"}
          </span>
          <button type="button" data-testid="onb-close" aria-label={t(language, "onboarding.cancel")} onClick={onClose}
            className="rounded-lg border border-border/50 p-1.5 text-muted-foreground hover:border-primary/60 hover:text-foreground">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
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
        <Button data-testid="onb-submit" variant="primary" disabled={busy || !valido} onClick={() => void submit()}>
          {busy ? t(language, "onboarding.saving") : t(language, mode === "create" ? "onboarding.create" : "registro.save")}
        </Button>
      </div>
    </div>
  );
}
