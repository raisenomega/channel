/**
 * HUB by Raisen — Composer del ChannelFrame (barra de input).
 */
import { t, type Idioma } from "@/lib/i18n";

export function ChannelComposer({ lang, value, onChange, onSend }: {
  lang: Idioma;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="cf-composer">
      <input
        className="cf-input"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        // #2: Enter envía (sin Shift). El botón [Enviar] sigue intacto -> ambos coexisten.
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) onSend();
          }
        }}
        placeholder={t(lang, "chat.placeholder")}
      />
      <button className="cf-send" type="button" onClick={() => onSend()} disabled={!value.trim()}>
        {t(lang, "chat.send")}
      </button>
    </div>
  );
}