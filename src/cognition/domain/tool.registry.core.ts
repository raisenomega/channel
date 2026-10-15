/**
 * HUB by Raisen — Tool registry CORE (Slide 4.0, declarativo, sin impl).
 * 10 tools core del §5 del doc v2.0. Inmutable. Formato ToolSpec array.
 * Se fusiona con tool.registry.ts cuando el tool executor se implemente (4.1+).
 * C4 ≤75.
 */
export interface ToolSpec {
  readonly nombre: string;
  readonly dominio: "cerebro" | "nucleo" | "omega" | "commerce" | "whatsapp";
  readonly accion: string;
  readonly requiere_puerta_pago: null | "nucleo" | "omega";
  readonly es_mutador: boolean;
  readonly min_tier_permitido: "esencial" | "pro" | "business" | "enterprise";
}

export const CORE_TOOL_SPECS: ReadonlyArray<ToolSpec> = Object.freeze([
  { nombre: "cerebro.retrieve",            dominio: "cerebro",  accion: "lookup_contexto_cliente",     requiere_puerta_pago: null,     es_mutador: false, min_tier_permitido: "pro" },
  { nombre: "nucleo.customer.summary",     dominio: "nucleo",   accion: "lookup_cliente",              requiere_puerta_pago: "nucleo", es_mutador: false, min_tier_permitido: "business" },
  { nombre: "omega.brand_voice.get",       dominio: "omega",    accion: "lookup_brand_voice",          requiere_puerta_pago: "omega",  es_mutador: false, min_tier_permitido: "business" },
  { nombre: "commerce.quote.create",       dominio: "commerce", accion: "crear_cotizacion",            requiere_puerta_pago: null,     es_mutador: true,  min_tier_permitido: "esencial" },
  { nombre: "commerce.pay.generate_link",  dominio: "commerce", accion: "generar_link_cobro",          requiere_puerta_pago: null,     es_mutador: true,  min_tier_permitido: "esencial" },
  { nombre: "whatsapp.catalog.set_item",   dominio: "whatsapp", accion: "publicar_producto_catalogo",  requiere_puerta_pago: null,     es_mutador: true,  min_tier_permitido: "esencial" },
  { nombre: "omega.content.request",       dominio: "omega",    accion: "pedir_estrategia_contenido",  requiere_puerta_pago: "omega",  es_mutador: true,  min_tier_permitido: "business" },
  { nombre: "omega.campaign.create",       dominio: "omega",    accion: "crear_campania",              requiere_puerta_pago: "omega",  es_mutador: true,  min_tier_permitido: "business" },
  { nombre: "nucleo.finance.monthly_close", dominio: "nucleo",  accion: "lookup_cierre_mensual",       requiere_puerta_pago: "nucleo", es_mutador: false, min_tier_permitido: "business" },
  { nombre: "nucleo.accounting.ingest_transaction", dominio: "nucleo", accion: "enviar_transaccion",   requiere_puerta_pago: "nucleo", es_mutador: true,  min_tier_permitido: "business" },
] as const);

if (CORE_TOOL_SPECS.length !== 10) throw new Error(`Expected 10 specs, got ${CORE_TOOL_SPECS.length}`);