/**
 * HUB by Raisen — Panel derecho del mockup de WhatsApp.
 * Conversación ampliada con burbujas y agrupación por día.
 */
import { waIcon } from "./wa-icons";
import { initials, dayLabel, timeLabel, type WaChat, type WaMsg, type WaContact } from "./wa-types";
import { Check } from "./wa-check";

export function WaSidePanel({ active, chat, contact, msgs, onOpenContact }: {
  active: boolean; chat: WaChat | null; contact: WaContact | undefined;
  msgs: readonly WaMsg[]; onOpenContact: () => void;
}) {
  return (
    <div className="wa-side">
      <div className="wa-side-conv">
        {!active || !chat ? (
          <div className="wa-logo">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.5 1.2 4.7 3.1 6.2L4 21l3.4-1.5c1.4.5 3 .8 4.6.8 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>
            <div style={{ fontSize: 14 }}>Selecciona una conversación</div>
          </div>
        ) : (
          <>
            <div className="wa-side-head">
              <span className="wa-avatar" style={{ background: chat.color, width: 40, height: 40, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials(chat.name)}</span>
              <div style={{ flex: 1 }}>
                <div className="wa-name">{chat.name}</div>
                <div className="wa-sub">{contact?.lastSeen ?? "en línea"}</div>
              </div>
              <div onClick={onOpenContact} style={{ cursor: "pointer", display: "flex", gap: 6, color: "#25d366" }}>
                <span dangerouslySetInnerHTML={{ __html: waIcon.config }} />
                <span style={{ fontSize: 12 }}>Info</span>
              </div>
            </div>
            <div className="wa-side-body">
              {msgs.map((m, i) => {
                const prev = msgs[i - 1];
                const showDay = !prev || dayLabel(prev.time) !== dayLabel(m.time);
                return (
                  <div key={m.id}>
                    {showDay ? <div className="wa-day" style={{ margin: "6px auto" }}>{dayLabel(m.time)}</div> : null}
                    <div style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start", marginBottom: 5 }}>
                      <div className={"wa-bubble " + (m.out ? "out" : "in")} style={m.out ? { background: "#1e3a5f", color: "#fff" } : undefined}>
                        {m.text}
                        <span className="wa-meta">
                          {timeLabel(m.time)}
                          {m.out ? <Check status={m.status} /> : null}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}