/**
 * HUB by Raisen — Definición de las pestañas de negocio del panel flotante.
 */

export type ChannelTab =
  | "agentes"
  | "agenda"
  | "sku"
  | "cotizacion"
  | "factura"
  | "pagos"
  | "plantillas"
  | "envios"
  | "contactos"
  | "documentos"
  | "config";

export const TABS: readonly ChannelTab[] = [
  "agentes",
  "agenda",
  "sku",
  "cotizacion",
  "factura",
  "pagos",
  "plantillas",
  "envios",
  "contactos",
  "documentos",
  "config",
];