/**
 * HUB by Raisen — Tenant form, 1 vista única. Sub-chips state-based.
 * Hotfix G: OAuth via getConnectUrl(tenantId) con JWT; exige tenant ya creado.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { resolveTenantId } from "@/lib/api-client";
import { getConnectUrl } from "@/lib/tenant-client/connect-channel";
import { ChannelConnectButton, type Platform } from "./channel-connect-button";

export interface TenantFormData {
  name: string; email: string; phone: string;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;

const P: Platform[] = ["whatsapp", "instagram", "facebook"];

export function TenantForm({ lang, onSave }: {
  lang: Idioma; onSave: (d: TenantFormData) => Promise<void>;
}) {
  const [f, setF] = useState<TenantFormData>({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ch, setCh] = useState<Record<string, boolean>>({});
  const [cn, setCn] = useState<Platform | null>(null);

  const oauth = async (p: Platform) => {
    setCn(p);
    try {
      const tenantId = resolveTenantId();
      if (!tenantId) throw Error("tenant_requerido");
      window.open(await getConnectUrl(tenantId, p), "_blank");
      setCh((x) => ({ ...x, [p]: true }));
    } catch { setErr(t(lang, "onboard.oauthError")); }
    finally { setCn(null); }
  };

  const save = async () => {
    if (!f.name || !f.email || !f.phone) { setErr(t(lang, "onboard.required")); return; }
    if (!E164_RE.test(f.phone)) { setErr("Phone must be E.164 format (+1XXXYYYZZZZ)"); return; }
    setBusy(true); setErr(null);
    try { await onSave(f); } catch { setErr(t(lang, "onboard.error")); }
    finally { setBusy(false); }
  };

  const inp = (k: keyof TenantFormData, typ?: string) => (
    <input className="chbar-chip" style={{ fontSize:13, padding:"7px 12px", width:"100%" }}
      placeholder={typ ? (k==="name"?t(lang,"onboard.businessName"):k==="email"?t(lang,"onboard.contactEmail"):t(lang,"onboard.phoneNumber")) + " *" : f[k]}
      type={typ || "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
    />
  );

  return (
    <div className="flex flex-col gap-3 p-3" style={{ maxWidth: 400 }}>
      {err ? <p className="text-xs text-critical">{err}</p> : null}
      {inp("name")}{inp("email", "email")}{inp("phone", "tel")}
      <div className="flex flex-wrap gap-2 mt-1">
        {P.map((p) => (
          <ChannelConnectButton key={p} lang={lang} platform={p}
            connected={!!ch[p]} loading={cn === p} onClick={() => oauth(p)}
          />
        ))}
      </div>
      <button type="button" className="chbar-chip on"
        style={{ fontSize:13, padding:"9px 18px", alignSelf:"flex-start", marginTop:4 }}
        onClick={save} disabled={busy}
      >{busy ? t(lang, "onboard.saving") : t(lang, "onboard.saveTenant")}</button>
    </div>
  );
}
