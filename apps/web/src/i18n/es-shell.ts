/* HUB by Raisen — ES: shell, inbox, dashboard resumen y canales. */
type Dict = Record<string, string>;

export const ES: Dict = {
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
  "inbox.filtros": "Filtros",
  "inbox.active": "Conversaciones activas",
  "inbox.total": "total",
  "inbox.empty": "Aun no hay conversaciones para este tenant.",
  "inbox.justNow": "ahora",
  "inbox.min": "m",
  "inbox.hour": "h",
  "filtro.estado.open": "Abiertas",
  "filtro.estado.pending": "Pendientes",
  "filtro.estado.snoozed": "Pospuestas",
  "filtro.estado.resolved": "Resueltas",
  "filtro.sla": "SLA",
  "filtro.sla.violated": "SLA violado",
  "filtro.clean": "Limpiar filtros",

  // Dashboard principal (vista inbox)
  "dash.activas": "Conversaciones abiertas",
  "dash.sinAsignar": "Sin asignar",
  "dash.plan": "Plan",
  "dash.conversaciones": "Conversaciones",
  "dash.ficha": "Ficha del contacto",
  "dash.fichaEmpty": "Selecciona una conversacion para ver el contexto 360 del contacto.",
  "dash.emptyTitle": "Tu inbox esta listo",
  "dash.emptyBody": "Conecta tu primer canal para recibir mensajes de WhatsApp, email y mas. Cuando lleguen conversaciones, apareceran aqui con su contexto completo.",
  "dash.emptyAction": "Conectar canal",
  "canal.whatsapp": "WhatsApp",
  "canal.email": "Email",
  "canal.instagram": "Instagram",
  "canal.facebook": "Facebook",
  "canal.telegram": "Telegram",
  "canal.sms": "SMS",
  "canal.x": "X",
  "canal.linkedin": "LinkedIn",
  "canal.webchat": "Webchat",
};