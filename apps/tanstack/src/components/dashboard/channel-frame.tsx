/**
 * HUB by Raisen — ChannelFrame (layout horizontal).
 * Distribuye la vista de CUALQUIER canal en dos columnas: celular (izq.)
 * y pestañas de negocio + contenido + composer (der.).
 */
import type { CSSProperties, ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import type { ChannelTab } from "./channel-tabs";
import { ChatAmplified } from "./channel-amplified-placeholder";
import { ChannelTabs } from "./channel-tabs-bar";
import { ChannelComposer } from "./channel-composer";

export type { ChannelTab } from "./channel-tabs";
export { ChatAmplified } from "./channel-amplified-placeholder";

export interface ChannelFrameProps {
  lang: Idioma;
  accent?: string;
  icon?: ReactNode;
  children: ReactNode;
  composerContent?: ReactNode;
  composerValue?: string;
  onComposerChange?: (value: string) => void;
  onSend?: () => void;
  active?: ChannelTab;
  onTabChange?: (tab: ChannelTab) => void;
}

export function ChannelFrame({
  lang, accent, children, composerContent, composerValue, onComposerChange, onSend, active, onTabChange,
}: ChannelFrameProps) {
  const accentColor = accent ?? "var(--primary)";
  return (
    <div className="cf-root" style={accent ? { "--wa-accent": accent } as CSSProperties : undefined}>
      <div className="cf-left">{children}</div>
      <div className="cf-right">
        <ChannelTabs lang={lang} accent={accentColor} active={active} onTabChange={onTabChange} />
        <div className="cf-content">
          {composerContent ?? <ChatAmplified lang={lang} />}
        </div>
        {active ? null : <ChannelComposer lang={lang} value={composerValue ?? ""} onChange={(v) => onComposerChange?.(v)} onSend={() => onSend?.()} />}
      </div>
    </div>
  );
}