import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export function SafeBoard() {
  const { language } = usePreferences();

  return (
    <section className="safe p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-foreground">
          {t(language, "safe.title")}
        </h3>
        <Badge tone="hub">Kill Switch</Badge>
      </div>
      <div className="safe-row flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(language, "safe.autonomy")}</span>
        <span className="safe-phases">
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= 2 ? "safe-step on" : "safe-step"}>
              {n}
            </span>
          ))}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Sin datos de autonomía. Aparecerán cuando el agente empiece a operar.
      </p>
    </section>
  );
}
