/**
 * HUB by Raisen — Pagina de SLA y Horarios (/settings/sla).
 * Configurar SLA por canal y horarios laborales por dia.
 * Datos desde sla_policies y business_hours via Supabase REST.
 */
import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import {
  listarSlaPolicies, listarBusinessHours,
  upsertSlaPolicy, upsertBusinessHours,
  type SlaPolicyItem, type BusinessHoursItem,
} from "@/lib/sla-client";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const SlaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/sla",
  component: SlaPage,
});

const DIAS = ["sla.day.0", "sla.day.1", "sla.day.2", "sla.day.3", "sla.day.4", "sla.day.5", "sla.day.6"];

function SlaPage() {
  const { language } = usePreferences();
  const [newChannel, setNewChannel] = useState("");
  const [newMaxMinutes, setNewMaxMinutes] = useState("60");

  const { data: policies, isPending: loadingP, refetch: refetchP } = useQuery({
    queryKey: ["sla-policies"],
    queryFn: async () => {
      const r = await listarSlaPolicies();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  const { data: hours, isPending: loadingH, refetch: refetchH } = useQuery({
    queryKey: ["sla-hours"],
    queryFn: async () => {
      const r = await listarBusinessHours();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  async function handleAddPolicy() {
    if (!newChannel.trim() || !newMaxMinutes) return;
    const r = await upsertSlaPolicy({
      channel: newChannel.trim().toLowerCase(),
      max_response_minutes: parseInt(newMaxMinutes, 10),
    });
    if (r.ok) {
      setNewChannel("");
      setNewMaxMinutes("60");
      void refetchP();
    }
  }

  return (
    <div className="view space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t(language, "sla.title")}</h2>

      {/* SLA Policies */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t(language, "sla.policies")}</h3>
        {loadingP ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            {t(language, "common.loading")}
          </div>
        ) : !policies || policies.length === 0 ? (
          <Card>
            <CardBody className="py-6 text-center">
              <p className="text-sm text-muted-foreground">{t(language, "sla.empty")}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-2">
            {policies.map((p) => (
              <SlaPolicyRow key={p.id} policy={p} language={language} />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <Input
            label={t(language, "sla.channel")}
            placeholder="whatsapp"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
          />
          <Input
            label={t(language, "sla.maxResponse")}
            type="number"
            value={newMaxMinutes}
            onChange={(e) => setNewMaxMinutes(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={handleAddPolicy}>
            {t(language, "sla.addPolicy")}
          </Button>
        </div>
      </div>

      {/* Business Hours */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t(language, "sla.businessHours")}</h3>
        {loadingH ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            {t(language, "common.loading")}
          </div>
        ) : (
          <div className="grid gap-2">
            {DIAS.map((d, idx) => (
              <BusinessHourRow
                key={idx}
                dayLabel={t(language, d)}
                hours={hours?.filter((h) => h.dayOfWeek === idx) ?? []}
                dayOfWeek={idx}
                language={language}
                onSaved={() => void refetchH()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlaPolicyRow({ policy, language }: { policy: SlaPolicyItem; language: "es" | "en" }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge tone="hub">{policy.channel}</Badge>
          <span className="text-sm text-muted-foreground">
            {t(language, "sla.maxResponse")}: <strong className="text-foreground">{policy.maxResponseMinutes} min</strong>
          </span>
        </div>
        <Switch checked={policy.enabled} />
      </div>
    </Card>
  );
}

function BusinessHourRow({
  dayLabel, hours, dayOfWeek, language, onSaved,
}: {
  dayLabel: string;
  hours: readonly BusinessHoursItem[];
  dayOfWeek: number;
  language: "es" | "en";
  onSaved: () => void;
}) {
  const existing = hours[0];
  const [openTime, setOpenTime] = useState(existing?.openTime ?? "09:00");
  const [closeTime, setCloseTime] = useState(existing?.closeTime ?? "18:00");
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  async function handleSave() {
    const r = await upsertBusinessHours({
      day_of_week: dayOfWeek,
      open_time: openTime,
      close_time: closeTime,
      enabled,
    });
    if (r.ok) onSaved();
  }

  return (
    <Card padded={false}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="w-24 text-sm font-medium text-foreground">{dayLabel}</span>
        <input
          type="time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className="h-8 w-20 rounded-lg border border-border/40 bg-card-soft px-2 text-xs text-foreground"
        />
        <span className="text-xs text-muted-foreground">{t(language, "sla.open")}</span>
        <input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className="h-8 w-20 rounded-lg border border-border/40 bg-card-soft px-2 text-xs text-foreground"
        />
        <span className="text-xs text-muted-foreground">{t(language, "sla.close")}</span>
        <Switch checked={enabled} onChange={setEnabled} />
        <Button variant="ghost" size="sm" onClick={handleSave}>
          {t(language, "sla.save")}
        </Button>
      </div>
    </Card>
  );
}