/**
 * HUB by Raisen — Toast mínimo (portal a body, auto-dismiss). Feedback transitorio, no persiste
 * estado ni datos (solo UI). Usado para confirmar "Guardado" tras el onboarding. C4 <=75.
 */
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Toast({ message, onHide, ms = 2500 }: {
  message: string;
  onHide: () => void;
  ms?: number;
}) {
  useEffect(() => {
    const id = setTimeout(onHide, ms);
    return () => clearTimeout(id);
  }, [onHide, ms]);
  return createPortal(
    <div role="status" data-testid="toast"
      className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-success/40 bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg">
      {message}
    </div>,
    document.body,
  );
}
