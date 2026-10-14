import { t } from "@/lib/i18n";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AccountCard({ language, email, tenant, plan }: {
  language: "es" | "en";
  email: string; tenant: string; plan: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="feat flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{t(language, "settings.email")}</span>
          <span className="text-sm font-mono text-foreground">{email}</span>
        </div>
        <div className="feat flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{t(language, "settings.tenant")}</span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{tenant}</span>
            <Badge tone="hub" className="text-[10px]">{plan}</Badge>
          </span>
        </div>
        <div className="feat flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{t(language, "settings.plan")}</span>
          <Badge tone="success">{plan}</Badge>
        </div>
      </CardBody>
    </Card>
  );
}