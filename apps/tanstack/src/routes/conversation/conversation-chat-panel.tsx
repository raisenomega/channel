/**
 * HUB by Raisen — Panel de chat del hilo del inbox.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { Mensaje } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatThread, type ChatMsg } from "@/components/dashboard/chat-bubbles";

export function ChatPanel({
  conversationId, messages, language, onBack, composerText, setComposerText, onSend, sending,
}: {
  conversationId: string;
  messages: readonly Mensaje[];
  language: Idioma;
  onBack: () => void;
  composerText: string;
  setComposerText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <div className="rounded-2xl glass-card" data-chat-thread>
      <div className="flex items-center justify-between gap-3 border-b border-border/30 p-3">
        <div className="flex items-center gap-3">
          <Avatar name="Conversacion" size="sm" />
          <div className="nm">
            <p className="text-sm font-semibold text-foreground">#{conversationId.length > 8 ? conversationId.slice(0, 8) + "..." : conversationId}</p>
            <p className="text-xs text-muted-foreground">{t(language, "dash.conversaciones")}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>{t(language, "inbox.filtros")}</Button>
      </div>

      {messages.length === 0 ? (
        <div className="flex h-64 items-center justify-center px-6 text-sm text-muted-foreground">{t(language, "chat.empty")}</div>
      ) : (
        <ChatThread messages={messages.map<ChatMsg>((m) => ({
          id: m.id, senderType: m.senderType, content: m.content, createdAt: m.createdAt,
          status: m.senderType === "contact" ? "read" : "delivered",
        }))} lang={language} />
      )}

      <div className="border-t border-border/30 p-3 flex gap-2">
        <textarea
          data-chat-input
          className="flex-1 rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm text-foreground resize-none"
          rows={2}
          placeholder={t(language, "chat.placeholder")}
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
        />
        <Button data-chat-send variant="primary" size="sm" disabled={!composerText.trim() || sending} onClick={onSend}>
          {t(language, "chat.send")}
        </Button>
      </div>
    </div>
  );
}