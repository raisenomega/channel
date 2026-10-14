/**
 * HUB by Raisen — Utilidades para pagina de Cotizaciones.
 */
export const STATUS_TONE: Record<string, "warn" | "hub" | "success" | "danger" | "process"> = {
  draft: "warn", sent: "hub", accepted: "success", rejected: "danger", expired: "process",
};

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}