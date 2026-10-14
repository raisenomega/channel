/**
 * HUB by Raisen — Barrel del cliente de settings.
 */
export type { Result, PrivacyConfig, ConsentLogEntry } from "./settings-client/types";
export { getPrivacyConfig, getConsentLog, optInAI } from "./settings-client/functions";