import { t } from "@/lib/i18n";
import type { Channel } from "@/lib/channels-client";
import type { ChannelKind } from "@/components/ui/channel-icon";
import type { Idioma } from "@/lib/i18n";

export function ConfigRows({
  language, canal, kind,
}: {
  language: Idioma;
  canal: Channel | undefined;
  kind: ChannelKind;
}) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(language, "channels.provider")}</span>
        <span className="text-foreground">
          {canal?.provider ?? t(language, "channels.providerNone")}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(language, "channels.syncStatus")}</span>
        <span className="text-foreground">
          {canal?.syncStatus ?? t(language, "channels.providerNone")}
        </span>
      </div>
      {!canal ? (
        <p className="text-xs text-muted-foreground">
          {t(language, "channels.emptyBody")} ({t(language, "canal." + kind)})
        </p>
      ) : null}
    </>
  );
}