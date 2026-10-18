/**
 * HUB by Raisen — S-10 (Compuertas #98/#101): tarjeta de registro del dashboard con CTA state
 * machine de 3 estados: sin tenant -> "Registrar WhatsApp" (abre overlay create); con tenant + 0
 * canales -> "Conectar Canales y Redes" (navega /channels); con tenant + canales -> "Editar datos"
 * (abre overlay edit). Un único botón (S-7, sin "Registrar" central). WhatsAppIcon #25D366. C4 <=75.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { readLocalSession } from "@/lib/auth";
import { OnboardingOverlay } from "./onboarding-overlay";

export function RegistroWhatsApp({ language, tenant, channelsConectados = 0, onDone }: {
  language: Idioma;
  tenant: { id: string; name: string; plan: string } | null;
  channelsConectados?: number;
  onDone: () => void;
}) {
  const [overlay, setOverlay] = useState<null | "create" | "edit">(null);
  const navigate = useNavigate();
  const email = readLocalSession()?.user?.email ?? "";
  const cta = !tenant
    ? { btn: "registro.ctaBtn", act: () => setOverlay("create") }
    : channelsConectados > 0
      ? { btn: "registro.editData", act: () => setOverlay("edit") }
      : { btn: "registro.connectCta", act: () => void navigate({ to: "/channels" }) };
  return (
    <div data-testid="registro-whatsapp" className="mb-4 flex items-center justify-between rounded-2xl glass-card p-3.5">
      <div className="flex items-center gap-2">
        <WhatsAppIcon size={22} />
        <div>
          <p className="text-sm font-bold text-foreground">{tenant ? tenant.name : t(language, "registro.cta")}</p>
          <p className="text-xs text-muted-foreground">{t(language, tenant ? "registro.registered" : "registro.ctaHint")}</p>
        </div>
      </div>
      <button type="button" data-testid="registro-cta" onClick={cta.act}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
        {t(language, cta.btn)}
      </button>
      {overlay ? (
        <OnboardingOverlay language={language} mode={overlay} email={email} plan={tenant?.plan ?? "esencial"}
          tenantId={tenant?.id} initial={overlay === "edit" && tenant ? { name: tenant.name } : undefined}
          onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); onDone(); }} />
      ) : null}
    </div>
  );
}
