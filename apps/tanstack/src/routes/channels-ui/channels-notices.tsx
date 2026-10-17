/**
 * HUB by Raisen — Avisos de /channels (Hotfix L-2). Extraidos para que
 * channels.tsx se mantenga bajo C4 <=75. Ningun aviso oculta el CATALOGO:
 * las 9 cards se renderizan siempre debajo.
 */
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { NeedTenantBanner } from "@/components/ui/need-tenant-banner";
import type { Idioma } from "@/lib/i18n";
import type { CanalesErrKind } from "./channels-fetchers";

export function LoadingNotice({ language }: { language: Idioma }) {
  return (
    <div className="view">
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {t(language, "channels.loading")}
      </div>
    </div>
  );
}

function ErrorNotice({ language, onRetry }: { language: Idioma; onRetry: () => void }) {
  return (
    <div className="mb-4 flex flex-col items-start gap-2 rounded-2xl glass-card p-4 text-sm" data-testid="channels-error">
      <p className="text-critical">{t(language, "channels.error")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>{t(language, "channels.retry")}</Button>
    </div>
  );
}

function EmptyNotice({ language }: { language: Idioma }) {
  return (
    <div className="mb-4 rounded-2xl glass-card p-4 text-sm text-muted-foreground" data-testid="channels-empty">
      {t(language, "channels.empty")} {t(language, "channels.emptyBody")}
    </div>
  );
}

/** Un solo aviso por estado: sin tenant > error de carga > vacio honesto. */
export function ChannelsNotice({ language, errKind, vacio, onRetry }: {
  language: Idioma;
  errKind: CanalesErrKind;
  vacio: boolean;
  onRetry: () => void;
}) {
  if (errKind === "config_incompleta") return <NeedTenantBanner language={language} prefijo="channels" />;
  if (errKind !== null) return <ErrorNotice language={language} onRetry={onRetry} />;
  if (vacio) return <EmptyNotice language={language} />;
  return null;
}
