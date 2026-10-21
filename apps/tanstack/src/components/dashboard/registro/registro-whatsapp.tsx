/**
 * HUB by Raisen — Barra de registro/edición de negocio (SOT: docs/DASHBOARD_PANEL_SOT.md). TODA la
 * barra abre el overlay (sin tenant -> crear; con tenant -> editar con prefill COMPLETO, Z-2). El CTA
 * vive a la DERECHA: "Crear mi negocio" / "Editar datos". Sin botón "Conectar Canales" (Z-2, quitado
 * por redundante). WhatsAppIcon #25D366. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { readLocalSession } from "@/lib/auth";
import type { OnboardingForm } from "@/lib/tenant-client/onboarding-fields";
import { fetchTenantPerfil } from "@/lib/tenant-client/tenant-profile";
import { Toast } from "@/components/ui/toast";
import { OnboardingOverlay } from "./onboarding-overlay";

export function RegistroWhatsApp({ language, tenant, onDone, logoUrl }: {
  language: Idioma;
  tenant: { id: string; name: string; plan: string } | null;
  onDone: () => void;
  logoUrl?: string | null; // branding_config.logo_url -> se muestra circular en vez del icono WhatsApp
}) {
  const [overlay, setOverlay] = useState<null | "create" | "edit">(null);
  const [initial, setInitial] = useState<Partial<OnboardingForm> | undefined>();
  const [guardado, setGuardado] = useState(false);
  const email = readLocalSession()?.user?.email ?? "";
  const abrir = async (): Promise<void> => {
    if (!tenant) { setInitial(undefined); setOverlay("create"); return; }
    const p = await fetchTenantPerfil(tenant.id); // Z-2: prefill COMPLETO (dato real), no solo name
    setInitial(p ?? { name: tenant.name });
    setOverlay("edit");
  };
  return (
    <div data-testid="registro-whatsapp" role="button" tabIndex={0} onClick={() => void abrir()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void abrir(); } }}
      className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl glass-card p-3.5 hover:border-primary/50">
      <div className="flex items-center gap-2">
        {logoUrl
          ? <img src={logoUrl} alt="" className="size-[22px] shrink-0 rounded-full object-cover" />
          : <WhatsAppIcon size={22} />}
        <div>
          <p className="text-sm font-bold text-foreground">{tenant ? tenant.name : t(language, "registro.cta")}</p>
          <p className="text-xs text-muted-foreground">{t(language, tenant ? "registro.registered" : "registro.ctaHint")}</p>
        </div>
      </div>
      <button type="button" data-testid={tenant ? "registro-editar" : "registro-crear"}
        onClick={(e) => { e.stopPropagation(); void abrir(); }}
        className="shrink-0 rounded-lg border border-primary/60 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
        {t(language, tenant ? "registro.editData" : "dash.createMyBusiness")}
      </button>
      {overlay ? (
        <OnboardingOverlay language={language} mode={overlay} email={email} plan={tenant?.plan ?? "esencial"}
          tenantId={tenant?.id} initial={initial}
          onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); setGuardado(true); onDone(); }} />
      ) : null}
      {guardado ? <Toast message={t(language, "registro.guardado")} onHide={() => setGuardado(false)} /> : null}
    </div>
  );
}
