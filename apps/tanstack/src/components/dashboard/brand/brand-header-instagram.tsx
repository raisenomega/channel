/**
 * HUB by Raisen — Cabecera de Instagram para el celular Samsung S25.
 * Identidad real: logo cámara, "Instagram" italic y DM.
 */
import { brandIcon } from "./brand-icons";

export function InstagramHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "6px 12px",
        background: "#ffffff",
        color: "#262626",
        borderBottom: "1px solid #dbdbdb",
        zIndex: 5,
      }}
    >
      <span className="bg-logo" dangerouslySetInnerHTML={{ __html: brandIcon("igCamera") }} />
      <span
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: 0.5,
        }}
      >
        Instagram
      </span>
      <span className="bg-logo" dangerouslySetInnerHTML={{ __html: brandIcon("igDm") }} />
    </div>
  );
}