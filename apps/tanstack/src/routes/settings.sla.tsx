/**
 * HUB by Raisen — Pagina de SLA y Horarios (/settings/sla).
 * Datos desde sla_policies y business_hours via Supabase REST.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { upsertSlaPolicy } from "@/lib/sla-client";
import { useSlaPolicies, useBusinessHours } from "./settings-sla/sla-fetchers";
import { SlaPolicyRow } from "./settings-sla/sla-policy-row";
import { BusinessHourRow } from "./settings-sla/sla-business-row";
import { DIAS } from "./settings-sla/sla-constants";
import { LoadingState, EmptyState } from "./settings-sla/sla-panels";
import { AddPolicyForm } from "./settings-sla/sla-add-form";

export const SlaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/sla",
  component: SlaPage,
});

function SlaPage() {
  const { language } = usePreferences();
  const [newChannel, setNewChannel] = useState("");
  const [newMaxMinutes, setNewMaxMinutes] = useState("60");
  const { data: policies, isPending: loadingP, refetch: refetchP } = useSlaPolicies();
  const { data: hours, isPending: loadingH, refetch: refetchH } = useBusinessHours();

  async function handleAddPolicy() {
    if (!newChannel.trim() || !newMaxMinutes) return;
    const r = await upsertSlaPolicy({
      channel: newChannel.trim().toLowerCase(),
      max_response_minutes: parseInt(newMaxMinutes, 10),
    });
    if (r.ok) { setNewChannel(""); setNewMaxMinutes("60"); void refetchP(); }
  }

  return (
    <div className="view space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t(language, "sla.title")}</h2>
      <div>
        <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t(language, "sla.policies")}</h3>
        {loadingP ? <LoadingState language={language} /> : !policies || policies.length === 0 ? (
          <EmptyState language={language} />
        ) : (
          <div className="grid gap-2">
            {policies.map((p) => <SlaPolicyRow key={p.id} policy={p} language={language} />)}
          </div>
        )}
        <AddPolicyForm language={language} newChannel={newChannel} onChannelChange={setNewChannel} newMaxMinutes={newMaxMinutes} onMaxChange={setNewMaxMinutes} onAdd={handleAddPolicy} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t(language, "sla.businessHours")}</h3>
        {loadingH ? <LoadingState language={language} /> : (
          <div className="grid gap-2">
            {DIAS.map((d, idx) => (
              <BusinessHourRow key={idx} dayLabel={t(language, d)} hours={hours?.filter((h) => h.dayOfWeek === idx) ?? []} dayOfWeek={idx} language={language} onSaved={() => void refetchH()} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}