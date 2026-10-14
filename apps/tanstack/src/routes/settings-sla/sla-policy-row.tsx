import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { SlaPolicyItem } from "@/lib/sla-client";

export function SlaPolicyRow({ policy, language }: { policy: SlaPolicyItem; language: "es" | "en" }) {
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