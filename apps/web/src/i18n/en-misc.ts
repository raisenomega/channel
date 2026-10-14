/* HUB by Raisen — EN: chat, integraciones, SAFE y comunes. */
type Dict = Record<string, string>;

export const EN: Dict = {
  // Chat thread (FASE 9.3)
  "chat.empty": "No messages in this conversation.",
  "chat.loading": "Loading messages...",
  "chat.placeholder": "Type a message...",
  "chat.send": "Send",
  "chat.sent": "Sent",
  "chat.fail": "Failed to send",

  // Ecosystem integrations (FASE 8)
  "integrations.title": "Integrations",
  "integrations.count": "integrated",
  "integrations.pending": "Loading integration status...",
  "integrations.syncError": "Could not read status from the server. Changes were kept locally.",
  "integrations.empty": "Integrations pending — available when you subscribe to Ecosystem plan.",
  "integrations.nucleo": "NUCLEO",
  "integrations.omega": "OMEGA",
  "integrations.pos": "POS",
  "integrations.table": "TABLE",
  "integrations.health": "HEALTH",
  "integrations.home": "HOME",
  "integrations.fleet": "FLEET",

  // SAFE governance (FASE 11)
  "safe.title": "SAFE governance",
  "safe.autonomy": "Autonomy",
  "safe.phaseLabel": "Phase {fase}",
  "safe.phase0": "Pure manual (AI only suggests)",
  "safe.phase1": "Only outside business hours",
  "safe.phase2": "Frequent queries in-hours (supervised)",
  "safe.phase3": "Quotes and orders < threshold",
  "safe.phase4": "Full with intelligent escalation",
  "safe.noAutonomy": "No autonomy data",
  "safe.killSwitchOn": "Kill switch active",
  "safe.killSwitchOff": "Kill switch off",
  "safe.totalEvals": "Total evaluations",
  "safe.disagreementAvg": "Avg disagreement",
  "safe.noDisagreement": "No data",
  "safe.approved": "Approved",
  "safe.abstained": "Abstained",
  "safe.blocked": "Blocked",
  "safe.empty": "No SAFE evaluations recorded yet. They'll appear here once the agent starts operating.",

  "common.selectTab": "Select a tab",
  "common.lite": "lite",
  "common.ecosystem": "ecosystem",
  "common.autonomous": "autonomous",
};