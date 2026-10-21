/**
 * HUB by Raisen — Definición de las pestañas de negocio del panel flotante.
 */

export type ChannelTab =
  | "agentes"
  | "agenda"
  | "cotizacion"
  | "factura"
  | "pagos"
  | "plantillas"
  | "envios"
  | "contactos"
  | "documentos";

export const TABS: readonly ChannelTab[] = [
  "agentes",
  "agenda",
  "cotizacion",
  "factura",
  "pagos",
  "plantillas",
  "envios",
  "contactos",
  "documentos",
];