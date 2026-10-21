/**
 * HUB by Raisen — S-2/S-8/S-9 + Z-2: estado + submit del onboarding. email EDITABLE (default = email
 * del auth; el backend usa el del JWT como owner, body.email solo fallback → editable es seguro).
 * 4 obligatorios: nombre + email + teléfono E.164 + país. El botón queda habilitado y submit muestra
 * el error del campo que falte (así "guardar" nunca es un no-op silencioso). C4 <=75.
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
  const [email, setEmail] = useState(opts.email); // Z-2: email editable (default = auth)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const setField = (k: keyof OnboardingForm, v: string): void => setForm((f) => ({ ...f, [k]: v }));

  async function submit(): Promise<boolean> {
    const name = form.name.trim();
    const e164 = normTel(form.phone);
    if (!name) { setErr("onboarding.nameRequired"); return false; }
    if (!email.trim()) { setErr("onboarding.emailRequired"); return false; }
    if (!E164.test(e164)) { setErr("onboarding.phoneRequired"); return false; }
    if (form.country_code === "") { setErr("onboarding.countryRequired"); return false; }
    setBusy(true); setErr(null);
    try {
      const payload = { ...form, name, phone: e164 };
      if (opts.mode === "create") await createTenant({ ...payload, email: email.trim() });
      else {
        const r = await actualizarPerfilTenant(opts.tenantId ?? "", payload);
        if (!r.ok) throw new Error(r.error);
      }
      opts.onDone();
      return true;
    } catch (e) {
      const m = String(e);
      setErr(m.includes("no_session") ? "onboarding.sessionExpired"
        : m.includes("Failed to fetch") ? "onboarding.networkError" : m); // mensaje claro, no crudo
      return false;
    } finally { setBusy(false); }
  }

  return { form, setField, submit, busy, err, email, setEmail };
}
