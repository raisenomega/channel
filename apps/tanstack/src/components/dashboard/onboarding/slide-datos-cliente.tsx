/**
 * HUB by Raisen — Slide 1/2 form: datos del cliente (name, email, phone, country, tz, lang, plan).
 * Calls onGoToStep2 when Siguiente clicked. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { PlanChips, type PlanSlug } from "./plan-chips";

const E164_RE = /^\+[1-9]\d{6,14}$/;

export interface TenantFormData {
  name: string; email: string; phone: string;
  country_code: string; timezone: string; default_language: string; plan: PlanSlug;
}

const COUNTRY_CODES: [string, string][] = [["PR", "Puerto Rico (+1)"], ["US", "United States (+1)"], ["MX", "México (+52)"], ["CO", "Colombia (+57)"], ["ES", "España (+34)"], ["AR", "Argentina (+54)"]];
const TIMEZONES: string[] = ["America/Puerto_Rico", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/Argentina/Buenos_Aires", "Europe/Madrid"];

export function SlideDatosCliente({ language, data, onChange, onGoToStep2 }: {
  language: Idioma; data: TenantFormData; onChange: (d: TenantFormData) => void;
  onGoToStep2: () => void;
}) {
  const inp = (k: keyof TenantFormData, typ?: string) =>
    <input className="chbar-chip" style={{ fontSize:13, padding:"7px 12px", width:"100%" }}
      type={typ ?? "text"} value={String(data[k] ?? "")}
      onChange={(e) => onChange({ ...data, [k]: e.target.value })} />;
  const sel = (k: keyof TenantFormData, opts: readonly (readonly [string, string])[] | readonly string[]) =>
    <select className="chbar-chip" style={{ fontSize:13, padding:"7px 12px", width:"100%" }}
      value={data[k] as string} onChange={(e) => onChange({ ...data, [k]: e.target.value })}>
      {opts.map((o) => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o[0]} value={o[0]}>{o[1]}</option>)}
    </select>;

  // M-11 (D-39-bis): el "Siguiente" se deshabilita si falta algo; antes era mudo.
  const motivo = !data.name.trim() ? "Falta el nombre comercial"
    : !E164_RE.test(data.phone) ? "Teléfono en formato E.164 (ej. +17871234567)"
    : !data.plan ? "Elige un plan"
    : "";
  const valid = () => motivo === "";

  return (
    <div className="flex flex-col gap-3 p-3" style={{ maxWidth:400 }}>
      <label className="text-xs text-muted-foreground">{t(language, "onboard.businessName")}</label>{inp("name")}
      <label className="text-xs text-muted-foreground">{t(language, "onboard.contactEmail")}</label>{inp("email", "email")}
      <label className="text-xs text-muted-foreground">{t(language, "onboard.phoneNumber")}</label>{inp("phone", "tel")}
      <label className="text-xs text-muted-foreground">País</label>{sel("country_code", COUNTRY_CODES)}
      <label className="text-xs text-muted-foreground">Zona horaria</label>{sel("timezone", TIMEZONES)}
      <label className="text-xs text-muted-foreground">Idioma</label>
      <select className="chbar-chip" style={{fontSize:13,padding:"7px 12px",width:"100%"}}
        value={data.default_language} onChange={(e) => onChange({...data, default_language:e.target.value})}>
        <option value="es">Español</option><option value="en">English</option>
      </select>
      <label className="text-xs text-muted-foreground">Plan</label><PlanChips language={language} value={data.plan as PlanSlug} onChange={(v) => onChange({...data, plan:v})} />
      <button type="button" className="chbar-chip on" disabled={!valid()}
        style={{fontSize:13,padding:"9px 18px",alignSelf:"flex-start",marginTop:4}}
        onClick={onGoToStep2}>{t(language, "common.next")}</button>
      {motivo ? <p className="text-xs text-critical" style={{marginTop:-2}}>{motivo}</p> : null}
    </div>
  );
}