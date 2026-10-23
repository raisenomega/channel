/**
 * HUB by Raisen — Control para adjuntar el LOGO del negocio (sección Marca y contexto operacional).
 * Clic -> selecciona imagen (PNG/JPG/WEBP/SVG, máx 2MB) -> sube DIRECTO a Supabase (sin Railway) y
 * refresca el logo de la barra. Preview SIEMPRE circular (object-cover), aunque la imagen sea cuadrada.
 */
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import { uploadLogo } from "@/lib/tenant-client/logo";

const MAX = 2 * 1024 * 1024;
const OK = ["image/png", "image/jpeg", "image/webp"];

export function LogoUpload({ lang, tenantId, logoUrl }: { lang: Idioma; tenantId?: string; logoUrl?: string | null }) {
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(f: File | undefined): Promise<void> {
    if (!f || !tenantId) return;
    if (!OK.includes(f.type)) { setErr("onboarding.logo.format"); return; }
    if (f.size > MAX) { setErr("onboarding.logo.size"); return; }
    setBusy(true); setErr(null);
    const url = await uploadLogo(tenantId, f);
    setBusy(false);
    if (!url) { setErr("onboarding.networkError"); return; }
    setPreview(url);
    void qc.invalidateQueries({ queryKey: ["mi-logo", tenantId] });
  }

  return (
    <div className="flex items-center gap-3 sm:col-span-2">
      <button type="button" onClick={() => ref.current?.click()} disabled={!tenantId || busy} aria-label={t(lang, "onboarding.logo.label")}
        className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border/50 bg-foreground/5 text-xl text-muted-foreground transition hover:border-primary/60 disabled:opacity-50">
        {preview ? <img src={preview} alt="logo" className="size-full object-cover" /> : <span>+</span>}
      </button>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{t(lang, "onboarding.logo.label")}</p>
        <p className="text-[11px] text-muted-foreground">
          {busy ? t(lang, "onboarding.saving") : err ? t(lang, err) : (tenantId ? t(lang, "onboarding.logo.hint") : t(lang, "onboarding.logo.needTenant"))}
        </p>
      </div>
      <input ref={ref} type="file" accept={OK.join(",")} className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}
