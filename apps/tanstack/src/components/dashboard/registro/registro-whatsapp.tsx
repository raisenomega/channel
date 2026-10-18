/**
 * HUB by Raisen — T-1/T-3 (Compuertas #112/#113): barra de registro UNIFICADA. TODA la barra es
 * el area clickeable que abre el overlay (sin tenant -> crear; con tenant -> editar, prefill).
 * Sin boton dorado "Registrar" separado (T-1, elimina el CTA duplicado). Recovery: la barra es
 * clickeable en CUALQUIER estado, aun si OAuth fallo. "Conectar Canales" = enlace secundario
 * (no dorado) con stopPropagation. WhatsAppIcon #25D366. C4 <=75.
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
  const abrir = () => setOverlay(tenant ? "edit" : "create"); // T-3: barra clickeable en todo estado
  const necesitaCanales = tenant !== null && channelsConectados === 0;
  return (
    <div data-testid="registro-whatsapp" role="button" tabIndex={0} onClick={abrir}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } }}
      className="mb-4 flex cursor-pointer items-center justify-between rounded-2xl glass-card p-3.5 hover:border-primary/50">
      <div className="flex items-center gap-2">
        <WhatsAppIcon size={22} />
        <div>
          <p className="text-sm font-bold text-foreground">{tenant ? tenant.name : t(language, "registro.cta")}</p>
          <p className="text-xs text-muted-foreground">{t(language, tenant ? "registro.registered" : "registro.ctaHint")}</p>
        </div>
      </div>
      {necesitaCanales ? (
        <button type="button" data-testid="registro-connect"
          onClick={(e) => { e.stopPropagation(); void navigate({ to: "/channels" }); }}
          className="shrink-0 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/60">
          {t(language, "registro.connectCta")}
        </button>
      ) : (
        <span data-testid="registro-hint" className="shrink-0 text-xs font-semibold text-primary">
          {t(language, tenant ? "registro.editData" : "registro.ctaBtn")}
        </span>
      )}
      {overlay ? (
        <OnboardingOverlay language={language} mode={overlay} email={email} plan={tenant?.plan ?? "esencial"}
          tenantId={tenant?.id} initial={overlay === "edit" && tenant ? { name: tenant.name } : undefined}
          onClose={() => setOverlay(null)} onDone={() => { setOverlay(null); onDone(); }} />
      ) : null}
    </div>
  );
}
