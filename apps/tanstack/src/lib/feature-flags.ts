/**
 * HUB by Raisen — Feature flags del frontend (lee __HUB_CONFIG__ o import.meta.env, default OFF).
 */

/** R-6-2: import manual de historial WhatsApp (.txt). Default false (diferido post-launch). */
export function importHistoryEnabled(): boolean {
  const cfg = (globalThis as Record<string, unknown>)["__HUB_CONFIG__"] as { importWhatsappHistory?: boolean } | undefined;
  if (typeof cfg?.importWhatsappHistory === "boolean") return cfg.importWhatsappHistory;
  return (import.meta.env.VITE_HUB_IMPORT_WHATSAPP_HISTORY as string | undefined) === "true";
}
