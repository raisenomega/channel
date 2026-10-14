import { t } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ThemeIcon } from "./theme-icon";

export function PreferencesCard({
  language, theme, nextLang, whiteLabel,
  onToggleLang, onToggleTheme, onToggleWhiteLabel,
}: {
  language: "es" | "en";
  theme: string;
  nextLang: string;
  whiteLabel: boolean;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onToggleWhiteLabel: () => void;
}) {
  return (
    <Card>
      <CardBody>
        <div className="feat flex items-center justify-between py-1">
          <div>
            <span className="text-sm text-muted-foreground">{t(language, "settings.language")}</span>
            <p className="text-[11px] text-dim">{t(language, "settings.languageValue")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onToggleLang}>
            {nextLang === "en" ? "EN" : "ES"}
          </Button>
        </div>

        <div className="feat flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{t(language, "settings.theme")}</span>
          <Button variant="ghost" size="sm" onClick={onToggleTheme} aria-label={t(language, "settings.theme")}>
            <ThemeIcon dark={theme === "dark"} />
          </Button>
        </div>

        <div className="feat flex items-center justify-between py-1">
          <div>
            <span className="text-sm text-muted-foreground">{t(language, "settings.whiteLabel")}</span>
            <p className="text-[11px] text-dim">{t(language, "settings.whiteLabelHint")}</p>
          </div>
          <Switch checked={whiteLabel} onChange={onToggleWhiteLabel} />
        </div>
      </CardBody>
    </Card>
  );
}