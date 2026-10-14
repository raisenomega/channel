import type { ReactNode } from "react";

/* ===== KPIs vitals (glass glow) ===== */

export function BentoKpi({
  label, num, unit, trend, down,
}: {
  label: string; num: string | number; unit?: string; trend?: string; down?: boolean;
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">{label}</div>
      <div className="bento-stat">
        <div className="num">
          {num}
          {unit ? <small>{unit}</small> : null}
        </div>
        {trend ? <div className={"trend" + (down ? " down" : "")}>{trend}</div> : null}
      </div>
    </div>
  );
}

/* ===== Título de sección / encabezado ===== */

export function BentoTitle({ icon, label, right }: {
  icon: ReactNode; label: string; right?: ReactNode;
}) {
  return (
    <div className="bento-title">
      <span className="ico">{icon}</span>
      <span>{label}</span>
      {right ? <span className="ml-auto">{right}</span> : null}
    </div>
  );
}