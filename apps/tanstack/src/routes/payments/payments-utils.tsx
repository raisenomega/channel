/**
 * HUB by Raisen — Utilidades para pagina de Pagos.
 */
export const STATUS_TONE: Record<string, "warn" | "success" | "danger" | "process"> = {
  pending: "warn", completed: "success", failed: "danger", refunded: "process",
};

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}