/**
 * HUB by Raisen — R-1: KPI del tenant compacto con nombre (1 linea, truncado) +
 * boton cuadrado [+] para crear negocio (reemplaza la card AgregarCliente). C4 <=75.
 */
export function BentoTenant({ label, name, plan, createLabel, onCreate }: {
  label: string;
  name?: string;
  plan?: string;
  createLabel: string;
  onCreate?: () => void;
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{label}</span>
        {onCreate ? (
          <button type="button" className="nav-tool" title={createLabel} aria-label={createLabel}
            style={{ width: 26, height: 26, padding: 0, lineHeight: 1, fontSize: 16 }} onClick={onCreate}>
            +
          </button>
        ) : null}
      </div>
      <div className="bento-stat">
        <div className="num" title={name || "—"}
          style={{ fontWeight: 500, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
          {name || "—"}
        </div>
        {plan ? <div className="trend">{plan}</div> : null}
      </div>
    </div>
  );
}
