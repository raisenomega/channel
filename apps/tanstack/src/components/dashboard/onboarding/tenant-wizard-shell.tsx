/**
 * HUB by Raisen — Full-page shell del celular para onboarding.
 * Reutiliza channel-phone-app + chbar. Sub-chips state-based.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { TenantForm, type TenantFormData } from "./tenant-form";

type SubChip = "basicos" | "canales" | "resumen";

export function TenantWizardShell({ lang }: { lang: Idioma }) {
  const navigate = useNavigate();
  const [chip, setChip] = useState<SubChip>("basicos");

  const handleSave = async (data: TenantFormData) => {
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("POST /tenants failed");
    void navigate({ to: "/inbox" });
  };

  const chips: SubChip[] = ["basicos", "canales", "resumen"];

  return (
    <div className="view">
      <div className="chbar">
        <div className="chbar-chiplist">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className={"chbar-chip" + (chip === c ? " on" : "")}
              onClick={() => setChip(c)}
            >
              <span>{t(lang, "onboard.subchips." + c)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="chbar-x"
          aria-label={t(lang, "onboard.close")}
          onClick={() => void navigate({ to: "/inbox" })}
        >
          ×
        </button>
      </div>
      <div className="channel-phone-app">
        {chip === "basicos" ? <TenantForm lang={lang} onSave={handleSave} /> : null}
        {chip === "canales" ? (
          <div className="flex flex-col gap-3 p-3 text-sm text-muted-foreground">
            <p>{t(lang, "onboard.subtitle")}</p>
          </div>
        ) : null}
        {chip === "resumen" ? (
          <div className="flex flex-col gap-3 p-3 text-sm text-muted-foreground">
            <p>{t(lang, "onboard.saveTenant")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}