/**
 * HUB by Raisen — Definición de las pestañas de negocio del panel flotante.
 */

export type ChannelTab =
  | "agentes"
  | "contactos"
  | "plantillas"
  | "cotizacion"
  | "factura"
  | "pagos"
  | "documentos";

export const TABS: readonly ChannelTab[] = [
  "agentes",
  "contactos",
  "plantillas",
  "cotizacion",
  "factura",
  "pagos",
  "documentos",
];