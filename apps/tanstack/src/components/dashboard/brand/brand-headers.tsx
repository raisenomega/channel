/**
 * HUB by Raisen — Dispatcher de la cabecera de marca según el canal.
 * Selecciona el componente de cabecera realista por brand.
 */
import type { BrandKind } from "./brand-specs";
import { InstagramHeader } from "./brand-header-instagram";
import { GmailHeader } from "./brand-header-gmail";
import { FacebookHeader } from "./brand-header-facebook";
import { WhatsAppHeader } from "./brand-header-whatsapp";
import { TelegramHeader } from "./brand-header-telegram";
import { XHeader } from "./brand-header-x";
import { LinkedinHeader } from "./brand-header-linkedin";
import { SmsHeader } from "./brand-header-sms";
import { WebChatHeader } from "./brand-header-webchat";

export function BrandHeader({ kind }: { kind: BrandKind }) {
  switch (kind) {
    case "instagram": return <InstagramHeader />;
    case "gmail": return <GmailHeader />;
    case "facebook": return <FacebookHeader />;
    case "whatsapp": return <WhatsAppHeader />;
    case "telegram": return <TelegramHeader />;
    case "x": return <XHeader />;
    case "linkedin": return <LinkedinHeader />;
    case "sms": return <SmsHeader />;
    case "webchat": return <WebChatHeader />;
  }
}