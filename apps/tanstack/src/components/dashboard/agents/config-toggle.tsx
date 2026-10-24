/**
 * HUB by Raisen — Fila de toggle reusable para el panel de config de agentes. C4 <=75.
 */
export function ConfigToggle({ label, on, onToggle, accent }: { label: string; on: boolean; onToggle: () => void; accent?: string }) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-2 py-0.5 text-left text-[11px]">
      <span className="text-foreground">{label}</span>
      <span className="relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors" style={{ background: on ? (accent ? `hsl(${accent})` : "hsl(var(--success))") : "hsl(var(--border))" }}>
        <span className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all" style={{ left: on ? "14px" : "2px" }} />
      </span>
    </button>
  );
}
