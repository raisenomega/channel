/**
 * HUB by Raisen — Tarjeta de regla de automatizacion.
 */
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { RuleListItem } from "@/lib/automation-client";
import { Row } from "./automation-utils";

export function RuleCard({ rule, language }: { rule: RuleListItem; language: "es" | "en" }) {
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