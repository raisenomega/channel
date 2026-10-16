/**
 * HUB by Raisen — Insignia de estado de plantilla WhatsApp (Slide 4.9).
 * C4 <=75. Mapea TemplateStatus a BadgeTone + texto i18n.
 */
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n";
import type { TemplateStatus } from "@/lib/templates-client/types";

const MAPA_TONE: Record<TemplateStatus, BadgeTone> = {
  approved: "success",
  pending_create: "warn",
  pending_meta: "warn",
  rejected: "danger",
  error: "danger",
  paused: "hub",
  disabled: "hub",
};

export function TemplateStatusBadge({ language, status }: { language: Idioma; status: TemplateStatus }) {
  return (
    <Badge tone={MAPA_TONE[status]} dot>
      {t(language, `templates.status.${status}`)}
    </Badge>
  );
}