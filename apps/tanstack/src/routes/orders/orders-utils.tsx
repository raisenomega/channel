/**
 * HUB by Raisen — Utilidades para pagina de Ordenes.
 */
export const STATUS_TONE: Record<string, "warn" | "hub" | "success" | "process" | "danger"> = {
  pending: "warn", confirmed: "hub", paid: "success",
  shipped: "process", delivered: "success", cancelled: "danger",
};

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}