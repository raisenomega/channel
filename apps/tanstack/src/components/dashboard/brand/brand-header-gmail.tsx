/**
 * HUB by Raisen — Cabecera de Gmail para el celular.
 * Identidad real: logo Gmail, título y búsqueda.
 */
import { brandIcon } from "./brand-icons";

export function GmailHeader() {
  return (
    <div
      className="bg-head"
      style={{
        background: "#ffffff",
        color: "#202124",
        zIndex: 5,
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px" }}>
        <span className="bg-row">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22 12l-1.9-1.6L22 8.9V5H2v14h20v-7z" opacity="0" />
            <path fill="#4285F4" d="M23 6.7c0-.6-.4-1-1-1H2c-.6 0-1 .4-1 1v4l11 6.5L23 10.7z" />
            <path fill="#EA4335" d="M1 14v3.3c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V14l-10.6-3.3z" opacity="0" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#5f6368" }}>Gmail</span>
        </span>
        <span className="bg-row" style={{ marginLeft: "auto", color: "#5f6368" }} dangerouslySetInnerHTML={{ __html: brandIcon("gmailSearch") }} />
      </div>
    </div>
  );
}