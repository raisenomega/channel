/**
 * HUB by Raisen — Plan selector with 5 chips for onboarding wizard.
 * Uses Chip component pattern. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Chip } from "@/components/ui/chip";

const PLANES = ["lite_starter", "lite_pro", "lite_business", "ecosystem", "enterprise"] as const;
export type PlanSlug = (typeof PLANES)[number];

export function PlanChips({ language, value, onChange }: {
  language: Idioma; value: PlanSlug | null; onChange: (v: PlanSlug) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLANES.map((slug) => (
        <Chip key={slug} active={value === slug} onClick={() => onChange(slug)}>
          {t(language, "plan." + slug)}
        </Chip>
      ))}
    </div>
  );
}