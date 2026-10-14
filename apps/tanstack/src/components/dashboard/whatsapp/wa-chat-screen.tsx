/**
 * HUB by Raisen — Pantalla de chat del mockup de WhatsApp.
 * Cabecera del hilo, burbujas con ticks y composer.
 */
import { waIcon } from "./wa-icons";
import { initials, dayLabel, timeLabel, type WaChat, type WaMsg, type WaContact } from "./wa-types";
import { Check } from "./wa-check";

export function ChatScreen({ chat, msgs, contact, onBack, onOpenContact }: {
  chat: WaChat; msgs: readonly WaMsg[]; contact: WaContact | undefined;
  onBack: () => void; onOpenContact: () => void;
}) {
  return (
    <div className="wa-chatview">
      <div className="wa-chatview-head">
        <span className="wa-ico" onClick={onBack} dangerouslySetInnerHTML={{ __html: waIcon.back }} />
        <span className="wa-avatar" style={{ background: chat.color, cursor: "pointer" }} onClick={onOpenContact}>{initials(chat.name)}</span>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpenContact}>
          <div className="wa-name">{chat.name}</div>
          <div className="wa-sub">{contact?.lastSeen ?? "en línea"}</div>
        </div>
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: waIcon.video }} />
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: waIcon.phone }} />
        <span className="wa-ico" dangerouslySetInnerHTML={{ __html: waIcon.more }} />
      </div>
      <div className="wa-chatview-body">
        {msgs.length === 0 ? (
          <div className="p-3 text-center text-xs text-gray-500">Conversación sin mensajes aún</div>
        ) : (
          msgs.map((m, i) => {
            const prev = msgs[i - 1];
            const showDay = !prev || dayLabel(prev.time) !== dayLabel(m.time);
            return (
              <div key={m.id}>
                {showDay ? <div className="wa-day">{dayLabel(m.time)}</div> : null}
                <div className={"wa-bubble " + (m.out ? "out" : "in")}>
                  {m.text}
                  <span className="wa-meta">
                    {timeLabel(m.time)}
                    {m.out ? <Check status={m.status} /> : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="wa-inputbar">
        <span className="wa-emoji" dangerouslySetInnerHTML={{ __html: waIcon.emoji }} />
        <span className="wa-clip" dangerouslySetInnerHTML={{ __html: waIcon.clip }} />
        <input className="wa-input" placeholder="Mensaje" readOnly />
        <span className="wa-cam" dangerouslySetInnerHTML={{ __html: waIcon.cam }} />
        <span className="wa-mic" dangerouslySetInnerHTML={{ __html: waIcon.mic }} />
        <span className="wa-send" dangerouslySetInnerHTML={{ __html: waIcon.send }} />
      </div>
    </div>
  );
}