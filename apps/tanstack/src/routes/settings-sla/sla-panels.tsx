import { t } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";

export function LoadingState({ language }: { language: "es" | "en" }) {
  return (
    <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
      {t(language, "common.loading")}
    </div>
  );
}

export function EmptyState({ language }: { language: "es" | "en" }) {
  return (
    <Card>
      <CardBody className="py-6 text-center">
        <p className="text-sm text-muted-foreground">{t(language, "sla.empty")}</p>
      </CardBody>
    </Card>
  );
}