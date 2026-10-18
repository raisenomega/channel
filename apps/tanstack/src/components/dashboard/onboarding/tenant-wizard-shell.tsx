/**
 * HUB by Raisen — 2-slide onboarding wizard (K-5).
 * Paso 1: SlideDatosCliente (create tenant + go step 2).
 * Paso 2: SlideRedesSociales (OAuth connect + finish).
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { apiFetch, rememberTenantId } from "@/lib/api-client";
import { SlideDatosCliente, type TenantFormData } from "./slide-datos-cliente";
import { SlideRedesSociales } from "./slide-redes-sociales";

export function TenantWizardShell({ lang }: { lang: Idioma }) {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState<TenantFormData>({
    name: "", email: "", phone: "", country_code: "PR", timezone: "America/Puerto_Rico",
    default_language: "es", plan: "lite_starter",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const crear = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await apiFetch("/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name, email: formData.email, phone: formData.phone,
          primary_phone: formData.phone, country_code: formData.country_code,
          timezone: formData.timezone, default_language: formData.default_language,
          plan: formData.plan,
        }),
      });
      if (!res.ok) { const b = await res.text(); throw new Error(b || `status ${res.status}`); }
      const creado = (await res.json()) as { id: string };
      rememberTenantId(creado.id);
      setPaso(2);
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl glass-card p-6">
        <h2 className="text-lg font-bold mb-2">{t(lang, paso === 1 ? "onboard.step1.title" : "onboard.step2.title")}</h2>
        {err ? <p className="text-xs text-critical mb-2">{err}</p> : null}
        {paso === 1 ? (
          busy ? <p className="text-sm text-muted-foreground">{t(lang, "onboard.saving")}</p>
            : <SlideDatosCliente language={lang} data={formData} onChange={setFormData} onGoToStep2={crear} />
        ) : (
          <SlideRedesSociales language={lang} onBack={() => setPaso(1)} />
        )}
      </div>
    </div>
  );
}