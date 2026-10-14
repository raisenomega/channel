/**
 * HUB by Raisen — Cabecera de X (Twitter) para el celular.
 * Identidad real: fondo negro con avatar y logo X.
 */
import { brandIcon } from "./brand-icons";

export function XHeader() {
  return (
    <div
      className="bg-head"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        background: "#000000",
        color: "#ffffff",
        zIndex: 5,
      }}
    >
      <span className="bg-avatar" style={{ color: "#fff" }}>u</span>
      <span className="bg-logo" style={{ marginLeft: "auto" }} dangerouslySetInnerHTML={{ __html: brandIcon("xLogo") }} />
      <span className="bg-logo" style={{ color: "#71767b" }} dangerouslySetInnerHTML={{ __html: brandIcon("smsPlus") }} />
    </div>
  );
}