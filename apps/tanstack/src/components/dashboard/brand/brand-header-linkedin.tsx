/**
 * HUB by Raisen — Cabecera de LinkedIn para el celular.
 * Identidad real: "in" azul, buscador y redactar.
 */
import { brandIcon } from "./brand-icons";

export function LinkedinHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "#ffffff",
        color: "#111",
        borderBottom: "1px solid #e0e0e0",
        zIndex: 5,
      }}
    >
      <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 800, fontSize: 20, color: "#0A66C2" }}>
        in
      </span>
      <input
        readOnly
        placeholder="Buscar"
        style={{
          flex: 1,
          background: "#eef3f8",
          border: "none",
          borderRadius: 5,
          padding: "7px 12px",
          fontSize: 13,
          outline: "none",
        }}
      />
      <span className="bg-logo" style={{ color: "#0A66C2" }} dangerouslySetInnerHTML={{ __html: brandIcon("gmailCompose") }} />
    </div>
  );
}