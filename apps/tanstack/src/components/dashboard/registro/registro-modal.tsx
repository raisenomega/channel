/**
 * HUB by Raisen — R-2/R-3: modal de 1 paso para Registrar/Editar el numero WhatsApp del negocio.
 * Crear -> POST /tenants (createTenant refresca la sesion: el scope queda bajo el nuevo tenant).
 * Editar -> PATCH /tenants/:id (NO cambia scope). Sin OTP ni validacion extra (friction diferida,
 * Compuerta #67); solo se normaliza a E.164 (sin espacios) antes de enviar. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { createTenant } from "@/lib/tenant-client/create-tenant";
import { actualizarTelefonoTenant } from "@/lib/tenant-client/update-tenant";
import { readLocalSession } from "@/lib/auth";

export function RegistroModal({ language, mode, tenantId, onClose, onDone }: {
  language: Idioma;
  mode: "create" | "edit";
  tenantId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [phone, setPhone] = useState("+1 787 ");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const e164 = phone.replace(/[^\d+]/g, ""); // R-2: normaliza a E.164 (sin espacios)
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) { setErr(t(language, "registro.phoneInvalid")); return; }
    setBusy(true); setErr(null);
    try {
      if (mode === "create") {
        const email = readLocalSession()?.user?.email ?? "";
        await createTenant({ name: email.split("@")[0] || "Mi negocio", email, phone: e164 });
      } else {
        const r = await actualizarTelefonoTenant(tenantId ?? "", e164);
        if (!r.ok) throw new Error(r.error);
      }
      onDone();
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl glass-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center gap-2">
          <WhatsAppIcon size={22} />
          <h2 className="text-base font-bold">{t(language, mode === "create" ? "registro.title" : "registro.editTitle")}</h2>
        </div>
        {err ? <p className="mb-2 text-xs text-critical">{err}</p> : null}
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="000 00 00" inputMode="tel"
          aria-label={t(language, "registro.title")}
          className="mb-3 w-full rounded-lg border border-border/50 bg-transparent px-3 py-2 text-sm" />
        <Button variant="primary" className="w-full" disabled={busy} onClick={() => void submit()}>
          {busy ? t(language, "registro.saving") : t(language, mode === "create" ? "registro.create" : "registro.save")}
        </Button>
      </div>
    </div>
  );
}
