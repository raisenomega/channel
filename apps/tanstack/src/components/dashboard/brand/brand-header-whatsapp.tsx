/**
 * HUB by Raisen — Cabecera de WhatsApp para el celular.
 * Identidad real: verde marca y avatar HB.
 */
import { brandIcon } from "./brand-icons";

export function WhatsAppHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 10px 8px",
        background: "#075e54",
        color: "#fff",
        zIndex: 5,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#128c7e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        HB
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>WhatsApp</span>
      <span className="bg-logo" dangerouslySetInnerHTML={{ __html: brandIcon("gmailSearch") }} />
    </div>
  );
}