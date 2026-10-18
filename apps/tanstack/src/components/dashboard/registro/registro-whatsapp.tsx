/**
 * HUB by Raisen — R-2/R-3/R-4: tarjeta de registro WhatsApp del dashboard.
 * Sin tenant -> CTA "Registrar WhatsApp" (abre modal create). Con tenant -> muestra el TENANT
 * (nombre, no contacto; Compuerta #66) + boton "Registrado" (abre modal edit del numero). C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { RegistroModal } from "./registro-modal";

export function RegistroWhatsApp({ language, tenant, onDone }: {
  language: Idioma;
  /** null = usuario sin tenant (muestra CTA Registrar); con tenant = muestra Registrado. */
  tenant: { id: string; name: string; plan: string } | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState<null | "create" | "edit">(null);
  const registrado = tenant !== null;
  return (
    <div data-testid="registro-whatsapp" className="mb-4 flex items-center justify-between rounded-2xl glass-card p-3.5">
      <div className="flex items-center gap-2">
        <WhatsAppIcon size={22} />
        <div>
          <p className="text-sm font-bold text-foreground">{registrado ? tenant.name : t(language, "registro.cta")}</p>
          <p className="text-xs text-muted-foreground">{registrado ? t(language, "registro.registered") : t(language, "registro.ctaHint")}</p>
        </div>
      </div>
      <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        onClick={() => setOpen(registrado ? "edit" : "create")}>
        {registrado ? t(language, "registro.registeredBtn") : t(language, "registro.ctaBtn")}
      </button>
      {open ? (
        <RegistroModal language={language} mode={open} tenantId={tenant?.id}
          onClose={() => setOpen(null)} onDone={() => { setOpen(null); onDone(); }} />
      ) : null}
    </div>
  );
}
