/**
 * HUB by Raisen — Cabecera de Web Chat para el celular.
 * Identidad real: fondo morado con avatar WB.
 */
import { brandIcon } from "./brand-icons";

export function WebChatHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "#6C63FF",
        color: "#fff",
        zIndex: 5,
      }}
    >
      <span className="bg-avatar">WB</span>
      <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>Web Chat</span>
      <span className="bg-logo" dangerouslySetInnerHTML={{ __html: brandIcon("gmailSearch") }} />
    </div>
  );
}