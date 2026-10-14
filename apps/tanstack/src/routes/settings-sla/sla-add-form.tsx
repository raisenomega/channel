import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddPolicyForm({
  language, newChannel, onChannelChange,
  newMaxMinutes, onMaxChange, onAdd,
}: {
  language: "es" | "en";
  newChannel: string;
  onChannelChange: (v: string) => void;
  newMaxMinutes: string;
  onMaxChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-3 flex items-end gap-2">
      <Input
        label={t(language, "sla.channel")}
        placeholder="whatsapp"
        value={newChannel}
        onChange={(e) => onChannelChange(e.target.value)}
      />
      <Input
        label={t(language, "sla.maxResponse")}
        type="number"
        value={newMaxMinutes}
        onChange={(e) => onMaxChange(e.target.value)}
      />
      <Button variant="primary" size="sm" onClick={onAdd}>
        {t(language, "sla.addPolicy")}
      </Button>
    </div>
  );
}