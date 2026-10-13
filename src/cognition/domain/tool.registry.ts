import { Result } from "../../shared/domain/result.ts";

export type ContentType =
  | "text" | "template" | "image" | "video" | "audio" | "document"
  | "location" | "contact_card" | "sticker" | "reaction" | "system_event";

export interface ToolDef {
  readonly name: string;
  readonly description: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly minConfidence: number;
  readonly requiresSafeEvaluation: boolean;
  readonly preconditions: readonly string[];
  readonly escalationTriggers: readonly string[];
}

export const TOOL_REGISTRY: Readonly<Record<string, ToolDef>> = Object.freeze({
  send_message: Object.freeze({
    name: "send_message", description: "Enviar mensaje al contacto",
    parameters: Object.freeze({ channel: "string", contactId: "string", text: "string" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]),
    escalationTriggers: Object.freeze([]),
  }),
  create_quote: Object.freeze({
    name: "create_quote", description: "Crear cotizacion para el contacto",
    parameters: Object.freeze({ contactId: "string", items: "array", total: "number" }),
    minConfidence: 0.9, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["contacto_existe", "items_no_vacio"]),
    escalationTriggers: Object.freeze(["monto_supera_umbral"]),
  }),
  send_payment_link: Object.freeze({
    name: "send_payment_link", description: "Enviar enlace de pago",
    parameters: Object.freeze({ orderId: "string", channel: "string" }),
    minConfidence: 0.9, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["order_existe", "monto_valido", "conversacion_no_bloqueada", "confianza_supera_07"]),
    escalationTriggers: Object.freeze([]),
  }),
  escalate_to_human: Object.freeze({
    name: "escalate_to_human", description: "Escalar a un agente humano",
    parameters: Object.freeze({ conversationId: "string", reason: "string", context: "object" }),
    minConfidence: 0.0, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]),
    escalationTriggers: Object.freeze([]),
  }),
  check_table_availability: Object.freeze({
    name: "check_table_availability", description: "Verificar mesas disponibles (TABLE)",
    parameters: Object.freeze({ datetime: "string", partySize: "number" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]),
    escalationTriggers: Object.freeze([]),
  }),
  get_fleet_delivery_status: Object.freeze({
    name: "get_fleet_delivery_status", description: "Consultar estado de entrega (FLEET)",
    parameters: Object.freeze({ orderId: "string" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]),
    escalationTriggers: Object.freeze([]),
  }),
});