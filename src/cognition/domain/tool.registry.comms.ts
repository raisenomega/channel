/**
 * HUB by Raisen — Tools de comunicacion (BC Cognition).
 * Registro parcial del Tool Registry separado por C4 (< 75 lineas).
 */
import type { ToolDef } from "./tool.types.ts";

export const COMMS_TOOLS: Readonly<Record<string, ToolDef>> = Object.freeze({
  send_message: Object.freeze({
    name: "send_message", description: "Enviar mensaje al contacto",
    parameters: Object.freeze({ channel: "string", contactId: "string", text: "string" }),
    minConfidence: 0.7, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]), escalationTriggers: Object.freeze([]),
  }),
  send_template: Object.freeze({
    name: "send_template", description: "Enviar plantilla aprobada al contacto",
    parameters: Object.freeze({ templateName: "string", language: "string", params: "array" }),
    minConfidence: 0.8, requiresSafeEvaluation: true,
    preconditions: Object.freeze(["plantilla_aprobada", "ventana_24h"]),
    escalationTriggers: Object.freeze([]),
  }),
  traducir_mensaje: Object.freeze({
    name: "traducir_mensaje", description: "Traducir mensaje a otro idioma",
    parameters: Object.freeze({ text: "string", targetLang: "string" }),
    minConfidence: 0.6, requiresSafeEvaluation: false,
    preconditions: Object.freeze(["texto_no_vacio"]), escalationTriggers: Object.freeze([]),
  }),
  actualizar_contacto: Object.freeze({
    name: "actualizar_contacto", description: "Actualizar datos del contacto",
    parameters: Object.freeze({ contactId: "string", field: "string", value: "string" }),
    minConfidence: 0.85, requiresSafeEvaluation: false,
    preconditions: Object.freeze(["contacto_existe", "confirmacion_contacto"]),
    escalationTriggers: Object.freeze(["campo_sensible"]),
  }),
  escalar_a_humano: Object.freeze({
    name: "escalar_a_humano", description: "Escalar la conversacion a un agente humano",
    parameters: Object.freeze({ conversationId: "string", reason: "string", context: "object" }),
    minConfidence: 0.0, requiresSafeEvaluation: false,
    preconditions: Object.freeze([]), escalationTriggers: Object.freeze([]),
  }),
});