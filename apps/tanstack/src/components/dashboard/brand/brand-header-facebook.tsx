/**
 * HUB by Raisen — Cabecera de Facebook para el celular.
 * Identidad real: logo, buscador y acceso.
 */
import { brandIcon } from "./brand-icons";

export function FacebookHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "#ffffff",
        color: "#1c1e21",
        borderBottom: "1px solid #e4e6eb",
        zIndex: 5,
      }}
    >
      <span className="bg-logo" dangerouslySetInnerHTML={{ __html: brandIcon("fbLogo") }} />
      <input
        readOnly
        placeholder="Buscar"
        style={{
          flex: 1,
          background: "#f0f2f5",
          border: "none",
          borderRadius: 20,
          padding: "7px 12px",
          fontSize: 13,
          outline: "none",
        }}
      />
      <span className="bg-logo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#65676b"><circle cx="12" cy="16" r="3" /><path d="M12 3l1.6 4H15v6h-2V8h-2v5H9V7h1.4z" /></svg>
      </span>
    </div>
  );
}