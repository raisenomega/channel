/**
 * HUB by Raisen — S-4/S-5/S-6: las 3 cards del onboarding (Datos físicos, Datos fiscales,
 * Brand Voice & Contexto Operacional). Todas opcionales (#102). brand voice alimenta a Victor +
 * CEREBRO. tone/sla son selects con los valores oficiales (espejo del CHECK de 052). C4 <=75.
 */
import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { OnboardingForm } from "@/lib/tenant-client/onboarding-fields";
import { BRAND_TONES, RESPONSE_SLAS } from "@/lib/tenant-client/onboarding-fields";
import { OnbField } from "./onboarding-field";

type Set = (k: keyof OnboardingForm, v: string) => void;
interface P { form: OnboardingForm; setField: Set; language: Idioma; }

function Card({ title, testId, children }: { title: string; testId: string; children: ReactNode }) {
  return (
    <div data-testid={testId} className="rounded-2xl glass-card p-4">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function OnboardingCards({ form, setField, language }: P) {
  const L = (k: string): string => t(language, k);
  const F = (k: keyof OnboardingForm): ((v: string) => void) => (v) => setField(k, v);
  const toneOpts = BRAND_TONES.map((v) => ({ value: v, label: L(`onboarding.tone.${v}`) }));
  const slaOpts = RESPONSE_SLAS.map((v) => ({ value: v, label: L(`onboarding.sla.${v}`) }));
  return (
    <>
      <Card title={L("onboarding.card.fisicos")} testId="onb-card-fisicos">
        <OnbField label={L("onboarding.f.street")} value={form.street} onChange={F("street")} />
        <OnbField label={L("onboarding.f.city")} value={form.city} onChange={F("city")} />
        <OnbField label={L("onboarding.f.region")} value={form.region} onChange={F("region")} />
        <OnbField label={L("onboarding.f.postal")} value={form.postal_code} onChange={F("postal_code")} />
      </Card>
      <Card title={L("onboarding.card.fiscales")} testId="onb-card-fiscales">
        <OnbField label={L("onboarding.f.legalName")} value={form.legal_name} onChange={F("legal_name")} />
        <OnbField label={L("onboarding.f.taxId")} value={form.tax_id} onChange={F("tax_id")} />
        <OnbField label={L("onboarding.f.industry")} value={form.industry} onChange={F("industry")} />
      </Card>
      <Card title={L("onboarding.card.brand")} testId="onb-card-brand">
        <OnbField label={L("onboarding.f.tone")} kind="select" value={form.brand_tone} onChange={F("brand_tone")} options={toneOpts} placeholder={L("onboarding.select")} />
        <OnbField label={L("onboarding.f.sla")} kind="select" value={form.expected_response_sla} onChange={F("expected_response_sla")} options={slaOpts} placeholder={L("onboarding.select")} />
        <OnbField label={L("onboarding.f.services")} kind="textarea" maxLength={200} value={form.brand_services} onChange={F("brand_services")} />
        <OnbField label={L("onboarding.f.audience")} kind="textarea" maxLength={150} value={form.brand_target_audience} onChange={F("brand_target_audience")} />
        <OnbField label={L("onboarding.f.hours")} value={form.operation_hours} onChange={F("operation_hours")} placeholder="Lun-Vie 8am-5pm AST" />
        <OnbField label={L("onboarding.f.mission")} kind="textarea" maxLength={200} value={form.brand_mission} onChange={F("brand_mission")} />
      </Card>
    </>
  );
}
