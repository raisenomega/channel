/**
 * HUB by Raisen — Selector de proveedor/modelo del Agente IA.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PROVIDER_OPTIONS = [
  { value: "anthropic", labelKey: "common.anthropic", models: ["common.claude35", "common.gpt4o"] },
  { value: "deepseek", labelKey: "common.deepseek", models: ["common.deepseekChat", "common.qwenMax"] },
  { value: "qwen", labelKey: "common.qwen", models: ["common.qwenMax", "common.gpt4o"] },
] as const;

export function ProviderSelector(language: Idioma) {
  const [selected, setSelected] = useState("anthropic");
  const [model, setModel] = useState("claude35");
  const current = PROVIDER_OPTIONS.find((p) => p.value === selected);
  const models = current?.models ?? [];

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-muted-foreground">{t(language, "agent.activeProvider")}</label>
      <div className="flex gap-2">
        {PROVIDER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSelected(opt.value); setModel(opt.models[0] ?? ""); }}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              selected === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border/70",
            )}
          >
            {t(language, opt.labelKey)}
          </button>
        ))}
      </div>
      {models.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t(language, "agent.model")}:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-border/40 bg-transparent px-2 py-1 text-xs text-foreground"
          >
            {models.map((m) => (
              <option key={m} value={m}>{t(language, m)}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}