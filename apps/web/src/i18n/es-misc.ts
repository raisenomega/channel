/* HUB by Raisen — ES: chat, integraciones, SAFE y comunes. */
type Dict = Record<string, string>;

export const ES: Dict = {
  // Chat thread (FASE 9.3)
  "chat.empty": "No hay mensajes en esta conversacion.",
  "chat.loading": "Cargando mensajes...",
  "chat.placeholder": "Escribe un mensaje...",
  "chat.send": "Enviar",
  "chat.sent": "Enviado",
  "chat.fail": "Error al enviar",

  // Integraciones ecosistema (FASE 8)
  "integrations.title": "Integraciones",
  "integrations.count": "integradas",
  "integrations.pending": "Cargando estado de integraciones...",
  "integrations.syncError": "No se pudo leer el estado del servidor. Los cambios quedaron locales.",
  "integrations.empty": "Integraciones pendientes — disponibles al suscribir al plan Ecosystem.",
  "integrations.nucleo": "NUCLEO",
  "integrations.omega": "OMEGA",
  "integrations.pos": "POS",
  "integrations.table": "TABLE",
  "integrations.health": "HEALTH",
  "integrations.home": "HOME",
  "integrations.fleet": "FLEET",

  // SAFE governance (FASE 11)
  "safe.title": "Gobernanza SAFE",
  "safe.autonomy": "Autonomía",
  "safe.phaseLabel": "Fase {fase}",
  "safe.phase0": "Manual puro (IA solo sugiere)",
  "safe.phase1": "Solo fuera de horario laboral",
  "safe.phase2": "Consultas frecuentes en horario (con supervisión)",
  "safe.phase3": "Cotizaciones y órdenes < umbral",
  "safe.phase4": "Completa con escalamiento inteligente",
  "safe.noAutonomy": "Sin datos de autonomía",
  "safe.killSwitchOn": "Kill Switch activado",
  "safe.killSwitchOff": "Kill Switch desactivado",
  "safe.totalEvals": "Evaluaciones totales",
  "safe.disagreementAvg": "Desacuerdo promedio",
  "safe.noDisagreement": "Sin datos",
  "safe.approved": "Aprobadas",
  "safe.abstained": "Abstenciones",
  "safe.blocked": "Bloqueadas",
  "safe.empty": "No hay evaluaciones SAFE registradas aún. Aparecerán aquí cuando el agente empiece a operar.",

  // Common
  "common.selectTab": "Selecciona una pestaña",
  "common.lite": "lite",
  "common.ecosystem": "ecosystem",
  "common.autonomous": "autonomous",
};