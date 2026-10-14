/**
 * HUB by Raisen — Cabecera de Telegram para el celular.
 * Identidad real: avión de papel y nombre azul.
 */
import { brandIcon } from "./brand-icons";

export function TelegramHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "#ffffff",
        color: "#0f0f0f",
        borderBottom: "1px solid #e6edf3",
        zIndex: 5,
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#26A5E4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dangerouslySetInnerHTML={{ __html: brandIcon("tgPlane") }}
      />
      <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Telegram</span>
      <span className="bg-logo" style={{ color: "#26A5E4" }} dangerouslySetInnerHTML={{ __html: brandIcon("pen") }} />
    </div>
  );
}