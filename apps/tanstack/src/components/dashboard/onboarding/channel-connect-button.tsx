/**
 * HUB by Raisen — Channel connect button with status visual.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type Platform = "whatsapp" | "instagram" | "facebook";

export function ChannelConnectButton({
  lang, platform, connected, loading, onClick,
}: {
  lang: Idioma;
  platform: Platform;
  connected: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const key = "onboard.connect" + platform.charAt(0).toUpperCase() + platform.slice(1);
  const icon = connected
    ? "\u2713"
    : "\u2717";
  return (
    <button
      type="button"
      className="chbar-chip"
      disabled={loading}
      style={{
        color: connected ? "hsl(var(--success))" : "hsl(var(--critical))",
        borderColor: connected ? "hsl(var(--success) / 0.5)" : "hsl(var(--critical) / 0.5)",
      }}
      onClick={onClick}
    >
      <span style={{ fontWeight: 700, fontSize: 14 }}>{icon}</span>
      <span>{t(lang, key)}</span>
      {loading ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
    </button>
  );
}