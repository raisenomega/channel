import { t } from "@/lib/i18n";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LoadingState({ language }: { language: "es" | "en" }) {
  return (
    <div className="view">
      <h2 className="mb-4 text-lg font-bold text-foreground">
        {t(language, "integrations.title")}
      </h2>
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {t(language, "common.loading")}
      </div>
    </div>
  );
}

export function ErrorBanner({ language, onRetry }: { language: "es" | "en"; onRetry: () => void }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl glass-card p-4 text-center">
      <p className="text-sm text-muted-foreground">
        {t(language, "integrations.syncError")}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t(language, "common.retry")}
      </Button>
    </div>
  );
}

export function EmptyState({ language }: { language: "es" | "en" }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl glass-card p-6 text-center">
      <span className="text-dim">
        <IntegrationIcon kind="fleet" className="size-8" />
      </span>
      <p className="text-sm font-medium text-foreground">
        {t(language, "integrations.empty")}
      </p>
      <p className="text-xs text-muted-foreground">
        {t(language, "integrations.emptyBody")}
      </p>
    </div>
  );
}

export function CounterBadge({ language, count }: { language: "es" | "en"; count: number }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          {t(language, "integrations.title")}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {count} {t(language, "integrations.count")}
          </span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}