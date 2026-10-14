/**
 * HUB by Raisen — Modal de creacion de regla de automatizacion.
 */
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { TRIGGER_OPTIONS, ACTION_OPTIONS } from "./automation-utils";

export function CreateRuleModal({
  language, formName, setFormName,
  formTrigger, setFormTrigger, formAction, setFormAction,
  onSave, onClose,
}: {
  language: "es" | "en";
  formName: string; setFormName: (v: string) => void;
  formTrigger: string; setFormTrigger: (v: string) => void;
  formAction: string; setFormAction: (v: string) => void;
  onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t(language, "automation.createTitle")}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Input label={t(language, "automation.name")} value={formName} onChange={(e) => setFormName(e.target.value)} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t(language, "automation.trigger")}</label>
            <select
              value={formTrigger}
              onChange={(e) => setFormTrigger(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground"
            >
              {TRIGGER_OPTIONS.map((o) => (
                <option key={o} value={o}>{t(language, "automation.trigger." + o)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">{t(language, "automation.action")}</label>
            <select
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground"
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o} value={o}>{t(language, "automation.action." + o)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={onSave}>{t(language, "automation.save")}</Button>
            <Button variant="ghost" onClick={onClose}>{t(language, "automation.cancel")}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}