/**
 * HUB by Raisen — Banner CTA cuando el usuario no tiene tenant (Hotfix L-2/L-3).
 * NO redirige: informa y ofrece el camino al wizard solo si el usuario lo pide.
 * Las claves son `<prefijo>.needTenant` y `<prefijo>.createClient`.
 * C4 <=75.
 */
import { useNavigate } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";

export function NeedTenantBanner({ language, prefijo }: { language: Idioma; prefijo: "channels" | "templates" }) {
  const navigate = useNavigate();
  return (
    <div className="mb-4 flex flex-col items-start gap-2 rounded-2xl glass-card p-4 text-sm" data-testid="need-tenant-banner">
      <p className="text-muted-foreground">{t(language, prefijo + ".needTenant")}</p>
      <Button variant="primary" size="sm" onClick={() => void navigate({ to: "/onboarding/tenant" })}>
        {t(language, prefijo + ".createClient")}
      </Button>
    </div>
  );
}
