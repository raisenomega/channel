/**
 * HUB by Raisen — Vista de inicio del mockup de WhatsApp.
 * Cabecera, pestañas (Chats/Estados/Llamadas) y lista de chats.
 */
import { waIcon } from "./wa-icons";
import { type WaChat } from "./wa-types";
import { WaChatList } from "./wa-chat-list";
import { PhoneShellEmptyState } from "./phone-shell-empty-state";
import { importHistoryEnabled } from "@/lib/feature-flags";

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="wa-chats p-4 text-center text-xs text-gray-500">
      <div className="mb-1 font-semibold text-gray-600">{label}</div>
      <div>Disponible en la app real de HUB</div>
    </div>
  );
}

export function WaHome({ chats, tab, onTab, onSelect }: {
  chats: readonly WaChat[];
  tab: "chats" | "status" | "calls";
  onTab: (t: "chats" | "status" | "calls") => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="wa-header">
        <span className="wa-avatar">HB</span>
        <span className="wa-title">WhatsApp</span>
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: waIcon.search }} />
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: waIcon.more }} />
      </div>
      <div className="wa-tabs">
        <span className={"wa-tab" + (tab === "chats" ? " on" : "")} onClick={() => onTab("chats")}>Chats</span>
        <span className={"wa-tab" + (tab === "status" ? " on" : "")} onClick={() => onTab("status")}>Estados</span>
        <span className={"wa-tab" + (tab === "calls" ? " on" : "")} onClick={() => onTab("calls")}>Llamadas</span>
      </div>
      {tab === "chats" ? (
        chats.length === 0
          ? <PhoneShellEmptyState importEnabled={importHistoryEnabled()} />
          : <WaChatList chats={chats} onSelect={onSelect} />
      ) : (
        <TabPlaceholder label={tab === "status" ? "Estados" : "Llamadas"} />
      )}
      <span className="wa-fab" dangerouslySetInnerHTML={{ __html: waIcon.chat }} />
    </>
  );
}