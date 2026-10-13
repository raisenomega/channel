import { lucide } from "@shared/domain/lucide-icons.ts";
import { t, type Idioma } from "./i18n.ts";

export function renderChannelSettings(
  channels: readonly { id: string; name: string; active: boolean; autonomous: boolean; status: string }[],
  lang: Idioma,
): string {
  return `<div class="view">
    <div class="section text-sm font-bold text-muted">${t(lang, "channels.connected")} <span class="more text-xs text-hub">${channels.length} ${t(lang, "channels.count")}</span></div>
    <div class="chips" style="margin-bottom:8px">
      ${channels.map((ch) => {
        const icon = ch.id === "whatsapp" ? "phone" : ch.id === "email" ? "mail" : ch.id === "webchat" ? "chat" : "message-square";
        return `<div class="chip flex items-center gap-sm" onclick="toggleChannel('${ch.id}')">
          ${lucide(icon, { size: 16 })}
          <span class="chip-name text-sm">${ch.name}</span>
          <span class="chip-status flex items-center gap-xs text-xs text-muted" style="margin-top:0">
            <span class="dot ${ch.active ? 'dot-on' : 'dot-off'}"></span>${ch.active ? t(lang, "channels.active") : t(lang, "channels.inactive")}
          </span>
        </div>`;
      }).join("")}
    </div>
    <div class="list">
      ${channels.map((ch) => {
        const icon = ch.id === "whatsapp" ? "phone" : ch.id === "email" ? "mail" : ch.id === "webchat" ? "chat" : "message-square";
        return `<div class="list-item flex items-center gap px-lg py-sm">
          <div class="avatar-sm" style="background:var(--hub)">${lucide(icon, { size: 14 })}</div>
          <div class="body flex-1">
            <div class="h flex items-center gap-sm">
              <span class="nm text-sm font-bold truncate">${ch.name}</span>
              <span class="tm text-xs text-dim">${ch.status}</span>
            </div>
          </div>
          <div class="switch ${ch.autonomous ? 'on' : 'off'}"><i></i></div>
        </div>`;
      }).join("")}
    </div>
    <div class="section text-sm font-bold text-muted">${t(lang, "channels.configureAI")}</div>
    <div class="card" style="padding:14px">
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">${t(lang, "channels.provider")}</span>
        <span class="text-hub" style="font-family:ui-monospace,monospace">anthropic</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">${t(lang, "channels.model")}</span>
        <span class="text-hub" style="font-family:ui-monospace,monospace">claude-sonnet-4-6</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <span class="text-muted">DeepSeek (BYOK)</span>
        <span class="text-hub" style="color:var(--hub-deep)">${t(lang, "channels.keyConfigured")}</span>
      </div>
      <div class="kv flex justify-between text-sm" style="padding:8px 0">
        <span class="text-muted">Qwen (BYOK)</span>
        <span class="text-hub" style="color:var(--hub-deep)">${t(lang, "channels.notConfigured")}</span>
      </div>
    </div>
  </div>`;
}