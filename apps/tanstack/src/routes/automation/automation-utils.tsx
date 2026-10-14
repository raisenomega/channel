/**
 * HUB by Raisen — Utilidades para pagina de Automatizaciones.
 */
export const TRIGGER_OPTIONS = [
  "newConversation", "messageReceived", "contactCreated", "quoteAccepted", "orderPaid",
] as const;

export const ACTION_OPTIONS = [
  "assignAgent", "sendNotification", "tagContact", "createTask",
] as const;

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}