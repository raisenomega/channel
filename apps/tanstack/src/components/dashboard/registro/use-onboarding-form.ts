/**
 * HUB by Raisen — S-2/S-8/S-9: estado + submit del onboarding completo. Solo `name` obligatorio
 * (#102). phone se normaliza a E.164 si viene (opcional). create -> POST /tenants (refresca sesion);
 * edit -> PATCH /tenants/:id (scope intacto, S-10). err = clave i18n (el overlay la traduce). C4 <=75.
 */
import { useState } from "react";
import { ONBOARDING_DEFAULTS, type OnboardingForm } from "@/lib/tenant-client/onboarding-fields";
import { createTenant } from "@/lib/tenant-client/create-tenant";
import { actualizarPerfilTenant } from "@/lib/tenant-client/update-tenant";

const E164 = /^\+[1-9]\d{6,14}$/;
const normTel = (p: string): string => p.replace(/[^\d+]/g, "");

export function useOnboardingForm(opts: {
  mode: "create" | "edit";
  tenantId?: string;
  email: string;
  initial?: Partial<OnboardingForm>;
  onDone: () => void;
}) {
  const [form, setForm] = useState<OnboardingForm>({ ...ONBOARDING_DEFAULTS, ...opts.initial });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const setField = (k: keyof OnboardingForm, v: string): void => setForm((f) => ({ ...f, [k]: v }));

  async function submit(): Promise<boolean> {
    const name = form.name.trim();
    if (!name) { setErr("onboarding.nameRequired"); return false; } // S-9: solo name obligatorio
    // phone OPCIONAL: se envia solo si es E.164 valido (el prefijo precargado +1 787 se descarta
    // hasta completarlo). Evita el telefono_invalido del backend sin bloquear "solo nombre".
    const e164 = normTel(form.phone);
    setBusy(true); setErr(null);
    try {
      const payload = { ...form, name, phone: E164.test(e164) ? e164 : "" };
      if (opts.mode === "create") await createTenant({ ...payload, email: opts.email });
      else {
        const r = await actualizarPerfilTenant(opts.tenantId ?? "", payload);
        if (!r.ok) throw new Error(r.error);
      }
      opts.onDone();
      return true;
    } catch (e) { setErr(String(e)); return false; } finally { setBusy(false); }
  }

  return { form, setField, submit, busy, err };
}
