import { t } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import type { IntegrationType } from "@/lib/integrations-client";
import type { Idioma } from "@/lib/i18n";

export function IntegracionItem({
  language, tipo, activa, configurada, pendiente, onToggle,
}: {
  language: Idioma;
  tipo: IntegrationType;
  activa: boolean;
  configurada: boolean;
  pendiente: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Card className={configurada ? "" : "opacity-80"}>
      <div className="flex items-center gap-3">
        <span className="text-primary">
          <IntegrationIcon kind={tipo} className="size-6" />
        </span>
        <div className="flex-1">
          <CardTitle className="text-sm">
            {t(language, "integrations." + tipo)}
          </CardTitle>
        </div>
      </div>

      <CardHeader className="mb-0 mt-3 flex items-center justify-between">
        <Badge tone={activa ? "success" : "warn"} dot>
          {t(language, activa ? "integrations.active" : "integrations.inactive")}
        </Badge>
        <Switch
          checked={activa}
          disabled={!configurada || pendiente}
          onChange={onToggle}
        />
      </CardHeader>
    </Card>
  );
}