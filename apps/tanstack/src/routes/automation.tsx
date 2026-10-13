/**
 * HUB by Raisen — Pagina de Automatizaciones (/automation).
 * Lista de reglas trigger→action, crear regla simple.
 * Datos desde automation_rules via Supabase REST.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { listarReglas, crearRegla, type RuleListItem } from "@/lib/automation-client";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AutomationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/automation",
  component: AutomationPage,
});

const TRIGGER_OPTIONS = [
  "newConversation", "messageReceived", "contactCreated", "quoteAccepted", "orderPaid",
] as const;

const ACTION_OPTIONS = [
  "assignAgent", "sendNotification", "tagContact", "createTask",
] as const;

function AutomationPage() {
  const { language } = usePreferences();
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("newConversation");
  const [formAction, setFormAction] = useState("assignAgent");

  const { data, isPending, refetch } = useQuery({
    queryKey: ["automation"],
    queryFn: async () => {
      const r = await listarReglas();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  async function handleCreate() {
    if (!formName.trim()) return;
    const r = await crearRegla({
      name: formName.trim(),
      trigger_event: formTrigger,
      action_type: formAction,
    });
    if (r.ok) {
      setShowCreate(false);
      setFormName("");
      setFormTrigger("newConversation");
      setFormAction("assignAgent");
      void refetch();
    }
  }

  return (
    <div className="view space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{t(language, "automation.title")}</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t(language, "automation.create")}
        </Button>
      </div>

      {isPending ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          {t(language, "common.loading")}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t(language, "automation.empty")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data.map((r) => (
            <RuleCard key={r.id} rule={r} language={language} />
          ))}
        </div>
      )}

      {showCreate ? (
        <CreateRuleModal
          language={language}
          formName={formName} setFormName={setFormName}
          formTrigger={formTrigger} setFormTrigger={setFormTrigger}
          formAction={formAction} setFormAction={setFormAction}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      ) : null}
    </div>
  );
}

function RuleCard({ rule, language }: { rule: RuleListItem; language: "es" | "en" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{rule.name}</CardTitle>
        {rule.enabled ? (
          <Badge tone="success" dot>{t(language, "automation.enabled")}</Badge>
        ) : (
          <Badge tone="warn">{t(language, "automation.enabled")}</Badge>
        )}
      </CardHeader>
      <CardBody>
        <Row
          label={t(language, "automation.trigger")}
          value={t(language, "automation.trigger." + rule.triggerEvent)}
        />
        <Row
          label={t(language, "automation.action")}
          value={t(language, "automation.action." + rule.actionType)}
        />
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function CreateRuleModal({
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