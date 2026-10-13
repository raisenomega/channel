/**
 * HUB by Raisen — Diccionario es/en + acceso traducido.
 * Fueente unica de cadenas de la UI. El estado de idioma lo gestiona interfaz.ts.
 */
export type Idioma = "es" | "en";

type Dict = Record<string, string>;

const ES: Dict = {
  // Shell / nav
  "nav.inbox": "Inbox",
  "nav.agent": "IA",
  "nav.channels": "Canales",
  "nav.settings": "Ajustes",

  // KPIs inbox
  "kpi.tenant": "Tenant",
  "kpi.wasCorrect": "IA Was Correct",
  "kpi.salesChat": "Ventas desde chat",
  "kpi.autonomy": "Autonomia",

  // Inbox
  "inbox.channels": "Canales",
  "inbox.seeAll": "Ver todos",
  "inbox.active": "Conversaciones activas",
  "inbox.total": "total",
  "inbox.empty": "Aun no hay conversaciones para este tenant.",
  "inbox.justNow": "ahora",
  "inbox.min": "m",
  "inbox.hour": "h",

  // Agent dashboard
  "agent.title": "Agente IA",
  "agent.providerLine": "Proveedor",
  "agent.model": "Modelo",
  "agent.wasCorrect": "Was Correct",
  "agent.indistinguishability": "Indistinguibilidad",
  "agent.autoResolve": "Resolucion autonoma",
  "agent.latency": "Latencia media",
  "agent.qualityMetrics": "Metricas de calidad IA",
  "agent.providerConfig": "Configuracion del proveedor IA",
  "agent.activeProvider": "Proveedor activo",
  "agent.byok": "BYOK",
  "agent.byokTenant": "Usando key del tenant",
  "agent.byokRaisen": "Usando key de Raisen",
  "agent.fallback": "Fallback",
  "agent.fallbackNone": "No configurado",
  "agent.autonomy": "Autonomia",
  "agent.outOfHours": "Fuera de horario laboral",
  "agent.frequentInHours": "Consultas frecuentes en horario",
  "agent.quotesOrders": "Cotizaciones y ordenes",
  "agent.alwaysEscalate": "Siempre escala a humano",
  "agent.complaint": "Queja detectada",
  "agent.vip": "Cliente VIP",
  "agent.amountThreshold": "Monto mayor a umbral",
  "agent.legal": "Solicitud legal",
  "agent.askHuman": "El cliente pide hablar con una persona",

  // Channels
  "channels.connected": "Canales conectados",
  "channels.count": "canales",
  "channels.active": "Activo",
  "channels.inactive": "Inactivo",
  "channels.configureAI": "Configurar proveedor IA",
  "channels.provider": "Proveedor",
  "channels.model": "Modelo",
  "channels.keyConfigured": "Key configurada",
  "channels.notConfigured": "No configurado",

  // Settings
  "settings.account": "Tu cuenta",
  "settings.email": "Email",
  "settings.tenant": "Tenant",
  "settings.plan": "Plan",
  "settings.preferences": "Preferencias",
  "settings.language": "Idioma",
  "settings.languageValue": "Espanol",
  "settings.theme": "Tema",
  "settings.whiteLabel": "White-label",

  // Common
  "common.selectTab": "Selecciona una pestana",
  "common.lite": "lite",
  "common.ecosystem": "ecosystem",
  "common.autonomous": "autonomous",
};

const EN: Dict = {
  "nav.inbox": "Inbox",
  "nav.agent": "AI",
  "nav.channels": "Channels",
  "nav.settings": "Settings",

  "kpi.tenant": "Tenant",
  "kpi.wasCorrect": "AI Was Correct",
  "kpi.salesChat": "Chat sales",
  "kpi.autonomy": "Autonomy",

  "inbox.channels": "Channels",
  "inbox.seeAll": "See all",
  "inbox.active": "Active conversations",
  "inbox.total": "total",
  "inbox.empty": "No conversations yet for this tenant.",
  "inbox.justNow": "now",
  "inbox.min": "m",
  "inbox.hour": "h",

  "agent.title": "AI Agent",
  "agent.providerLine": "Provider",
  "agent.model": "Model",
  "agent.wasCorrect": "Was Correct",
  "agent.indistinguishability": "Indistinguishability",
  "agent.autoResolve": "Autonomous resolution",
  "agent.latency": "Avg latency",
  "agent.qualityMetrics": "AI quality metrics",
  "agent.providerConfig": "AI provider configuration",
  "agent.activeProvider": "Active provider",
  "agent.byok": "BYOK",
  "agent.byokTenant": "Using tenant key",
  "agent.byokRaisen": "Using Raisen key",
  "agent.fallback": "Fallback",
  "agent.fallbackNone": "Not configured",
  "agent.autonomy": "Autonomy",
  "agent.outOfHours": "Outside business hours",
  "agent.frequentInHours": "Frequent queries in-hours",
  "agent.quotesOrders": "Quotes and orders",
  "agent.alwaysEscalate": "Always escalate to human",
  "agent.complaint": "Complaint detected",
  "agent.vip": "VIP client",
  "agent.amountThreshold": "Amount above threshold",
  "agent.legal": "Legal request",
  "agent.askHuman": "Client asks to talk to a person",

  "channels.connected": "Connected channels",
  "channels.count": "channels",
  "channels.active": "Active",
  "channels.inactive": "Inactive",
  "channels.configureAI": "Configure AI provider",
  "channels.provider": "Provider",
  "channels.model": "Model",
  "channels.keyConfigured": "Key configured",
  "channels.notConfigured": "Not configured",

  "settings.account": "Your account",
  "settings.email": "Email",
  "settings.tenant": "Tenant",
  "settings.plan": "Plan",
  "settings.preferences": "Preferences",
  "settings.language": "Language",
  "settings.languageValue": "English",
  "settings.theme": "Theme",
  "settings.whiteLabel": "White-label",

  "common.selectTab": "Select a tab",
  "common.lite": "lite",
  "common.ecosystem": "ecosystem",
  "common.autonomous": "autonomous",
};

const TABLAS: Record<Idioma, Dict> = { es: ES, en: EN };

export function t(idioma: Idioma, key: string): string {
  return TABLAS[idioma]?.[key] ?? key;
}