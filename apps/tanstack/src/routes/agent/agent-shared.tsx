/**
 * HUB by Raisen — Componentes compartidos de la página Agente IA.
 * SectionTitle, KvRow, switches de autonomía y card de error.
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function SectionTitle({ label }: { label: string }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
  );
}

export function KvRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", highlight ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
  );
}

export function AutonomySwitchRow({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onChange={setChecked} />
    </div>
  );
}

export const ESCALATION_ITEMS = [
  { key: "agent.complaint" },
  { key: "agent.vip" },
  { key: "agent.amountThreshold" },
  { key: "agent.legal" },
  { key: "agent.askHuman" },
] as const;

export function ErrorCard({ message }: { message: string }) {
  const { language } = usePreferences();
  return (
    <Card className="mb-4 border-critical/30">
      <CardBody className="flex flex-col items-center py-6 text-center">
        <p className="text-sm text-critical">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-background hover:bg-primary/90"
        >
          {t(language, "common.retry")}
        </button>
      </CardBody>
    </Card>
  );
}