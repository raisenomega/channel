/**
 * HUB by Raisen — Tools de operaciones (BC Cognition).
 * Registro parcial del Tool Registry separado por C4 (< 75 lineas).
 */
import type { ToolDef } from "./tool.types.ts";

export const OPS_TOOLS: Readonly<Record<string, ToolDef>> = Object.freeze({
  check_table_availability: Object.freeze({
    name: "check_table_availability", description: "Verificar mesas disponibles (TABLE)",
    parameters: Object.freeze({ datetime: "string", partySize: "number" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]), escalationTriggers: Object.freeze([]),
  }),
  book_appointment: Object.freeze({
    name: "book_appointment", description: "Agendar una cita o reserva",
    parameters: Object.freeze({ serviceType: "string", datetime: "string", contactId: "string", notes: "string" }),
    minConfidence: 0.8, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["horario_disponible", "fecha_futura", "dentro_horario_laboral"]),
    escalationTriggers: Object.freeze(["conflicto_horario", "servicio_no_disponible"]),
  }),
  resolve_complaint: Object.freeze({
    name: "resolve_complaint", description: "Resolver un reclamo siguiendo protocolo",
    parameters: Object.freeze({ complaintId: "string", resolution: "string", compensation: "object" }),
    minConfidence: 0.85, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["complaint_existe", "protocolo_aplica", "contacto_identificado"]),
    escalationTriggers: Object.freeze(["compensation_supera_umbral", "riesgo_legal"]),
  }),
  get_fleet_delivery_status: Object.freeze({
    name: "get_fleet_delivery_status", description: "Consultar estado de entrega (FLEET)",
    parameters: Object.freeze({ orderId: "string" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]), escalationTriggers: Object.freeze([]),
  }),
  programar_recordatorio: Object.freeze({
    name: "programar_recordatorio", description: "Programar un recordatorio para el contacto",
    parameters: Object.freeze({ contactId: "string", when: "string", text: "string" }),
    minConfidence: 0.75, requiresSafeEvaluation: false,
    preconditions: Object.freeze(["fecha_futura", "contacto_existe"]),
    escalationTriggers: Object.freeze([]),
  }),
  recomendar_producto: Object.freeze({
    name: "recomendar_producto", description: "Recomendar producto del catalogo al contacto",
    parameters: Object.freeze({ contactId: "string", preference: "string", maxResults: "number" }),
    minConfidence: 0.65, requiresSafeEvaluation: false,
    preconditions: Object.freeze(["catalogo_disponible"]),
    escalationTriggers: Object.freeze([]),
  }),
});