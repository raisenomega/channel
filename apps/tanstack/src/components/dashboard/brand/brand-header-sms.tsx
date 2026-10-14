/**
 * HUB by Raisen — Cabecera de Mensajes (SMS) para el celular.
 * Identidad real: título y botón nuevo mensaje verde.
 */
import { brandIcon } from "./brand-icons";

export function SmsHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "#ffffff",
        color: "#111",
        borderBottom: "1px solid #eee",
        zIndex: 5,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Mensajes</span>
      <span className="bg-logo" style={{ color: "#4CAF50" }} dangerouslySetInnerHTML={{ __html: brandIcon("smsPlus") }} />
    </div>
  );
}