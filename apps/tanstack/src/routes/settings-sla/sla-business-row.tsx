import { useState } from "react";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { upsertBusinessHours } from "@/lib/sla-client";
import type { BusinessHoursItem } from "@/lib/sla-client";

export function BusinessHourRow({
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