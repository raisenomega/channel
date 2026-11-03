/**
 * HUB by Raisen — Campo del modal de plantilla: etiqueta + NOTA honesta (que poner) + contador de
 * caracteres vs limite de Meta (rojo si se pasa) + el input. Todo claro y legible. C4 <=75. Sin any.
 */
import type { ReactNode } from "react";

export function UsageField({ label, nota, valor, max, children }: {
  label: string;
  nota: string;
  valor?: string;
  max?: number;
  children: ReactNode;
}) {
  const over = typeof valor === "string" && typeof max === "number" && valor.length > max;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        {typeof max === "number" ? (
          <span className={"text-[11px] " + (over ? "font-bold text-red-500" : "text-muted-foreground")}>{valor?.length ?? 0}/{max}</span>
        ) : null}
      </div>
      {children}
      <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>
    </div>
  );
}
