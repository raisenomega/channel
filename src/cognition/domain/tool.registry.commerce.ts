/**
 * HUB by Raisen — Tools de comercio (BC Cognition).
 * Registro parcial del Tool Registry separado por C4 (< 75 lineas).
 */
import type { ToolDef } from "./tool.types.ts";

export const COMMERCE_TOOLS: Readonly<Record<string, ToolDef>> = Object.freeze({
  create_quote: Object.freeze({
    name: "create_quote", description: "Crear cotizacion para el contacto",
    parameters: Object.freeze({ contactId: "string", items: "array", total: "number" }),
    minConfidence: 0.9, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["contacto_existe", "items_no_vacio"]),
    escalationTriggers: Object.freeze(["monto_supera_umbral"]),
  }),
  send_payment_link: Object.freeze({
    name: "send_payment_link", description: "Enviar enlace de pago al contacto",
    parameters: Object.freeze({ orderId: "string", channel: "string", amount: "number" }),
    minConfidence: 0.9, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["order_existe", "monto_valido", "confianza_supera_07"]),
    escalationTriggers: Object.freeze(["monto_supera_umbral"]),
  }),
  cancel_order: Object.freeze({
    name: "cancel_order", description: "Cancelar una orden existente del contacto",
    parameters: Object.freeze({ orderId: "string", reason: "string", notifyContact: "boolean" }),
    minConfidence: 0.9, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["order_existe", "order_no_entregada", "confirma_contacto"]),
    escalationTriggers: Object.freeze(["cancelacion_tardia", "reembolso_supera_umbral"]),
  }),
  check_order_status: Object.freeze({
    name: "check_order_status", description: "Consultar estado actual de una orden",
    parameters: Object.freeze({ orderId: "string", includeHistory: "boolean" }),
    minConfidence: 0.5, requiresSafeEvaluation: false,
    preconditions: Object.freeze(["order_existe"]),
    escalationTriggers: Object.freeze(["order_con_incidencia"]),
  }),
  procesar_pago: Object.freeze({
    name: "procesar_pago", description: "Procesar un pago de una orden",
    parameters: Object.freeze({ orderId: "string", method: "string", amount: "number" }),
    minConfidence: 0.95, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["order_existe", "monto_validado", "token_pago"]),
    escalationTriggers: Object.freeze(["monto_supera_umbral", "pago_con_fraude"]),
  }),
});