/**
 * HUB by Raisen — Slide 2/2: OAuth social network connect 2x3 grid.
 * Uses ChannelConnectButton for active platforms, placeholders for others. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ChannelConnectButton } from "./channel-connect-button";

interface SocialItem { key: string; nameKey: string; platform?: string; placeholder?: boolean; disabled?: boolean; }

const GRID: SocialItem[] = [
  { key: "whatsapp", nameKey: "onboard.connectWhatsapp", platform: "whatsapp" },
  { key: "instagram", nameKey: "onboard.connectInstagram", platform: "instagram" },
  { key: "facebook", nameKey: "onboard.connectFacebook", platform: "facebook" },
  { key: "email", nameKey: "Email (Resend/SMTP)", placeholder: true },
  { key: "sms", nameKey: "SMS (Zernio)", placeholder: true },
  { key: "telegram", nameKey: "Telegram", placeholder: true, disabled: true },
];

export function SlideRedesSociales({ language, onBack }: {
  language: Idioma; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-3" style={{ maxWidth:400 }}>
      <p className="text-xs text-muted-foreground">{t(language, "onboard.subtitle")}</p>
      <div className="grid grid-cols-3 gap-3">
        {GRID.map((item) =>
          item.placeholder
            ? <div key={item.key} className="flex items-center justify-center rounded-2xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground opacity-50"><span>{item.nameKey}</span></div>
            : <ChannelConnectButton key={item.key} lang={language} platform={item.platform! as never} connected={false} loading={false} onClick={() => {}} />
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <button type="button" className="chbar-chip" style={{fontSize:13,padding:"9px 18px"}} onClick={onBack}>{t(language, "common.back")}</button>
        <button type="button" className="chbar-chip on" style={{fontSize:13,padding:"9px 18px"}} onClick={() => { if (typeof window !== "undefined") window.location.href = "/inbox"; }}>{t(language, "onboard.saveFinal")}</button>
      </div>
    </div>
  );
}