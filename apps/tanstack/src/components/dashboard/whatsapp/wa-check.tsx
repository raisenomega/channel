/**
 * HUB by Raisen — Check de ticks de entrega estilo WhatsApp.
 * ✓ enviado, ✓✓ entregado, ✓✓ azul leído.
 */
import type { WaMsg } from "./wa-types";

export function Check({ status }: { status: WaMsg["status"] }) {
  const read = status === "read";
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }} title={String(status)}>
      <svg viewBox="0 0 16 10" width="13" height="8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 5l3.5 3.5L11 1.5" />
        {!read ? null : <path d="M6 7l3 3L15 4" />}
      </svg>
    </span>
  );
}