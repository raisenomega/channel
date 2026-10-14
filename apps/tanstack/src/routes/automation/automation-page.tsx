/**
 * HUB by Raisen — Pagina de Automatizaciones (componente principal).
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import { crearRegla } from "@/lib/automation-client";
import { useAutomationData } from "./automation-fetchers";
import { RuleCard } from "./automation-card";
import { LoadingState, EmptyState } from "./automation-states";
import { CreateRuleModal } from "./automation-modal";
import { AutomationHeader } from "./automation-header";

export function AutomationPage() {
  const { language } = usePreferences();
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("newConversation");
  const [formAction, setFormAction] = useState("assignAgent");

  const { rules, isPending, refetch } = useAutomationData();

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
      <AutomationHeader language={language} onCreate={() => setShowCreate(true)} />

      {isPending ? (
        <LoadingState language={language} />
      ) : !rules || rules.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <div className="grid gap-3">
          {rules.map((r) => (
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