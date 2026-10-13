import { Result } from "../../shared/domain/result.ts";
import { ContactId, TenantId, QuoteId } from "../../shared/domain/ids.ts";

export interface NUCLEOGateway {
  syncContact(tenantId: TenantId, contactId: ContactId): Promise<Result<void, IntegracionError>>;
  crearFactura(tenantId: TenantId, quoteId: QuoteId): Promise<Result<string, IntegracionError>>;
  obtenerContacto(tenantId: TenantId, nucleoCustomerId: string): Promise<Result<Record<string, unknown>, IntegracionError>>;
}

export interface OMEGAGateway {
  obtenerBrandVoice(tenantId: TenantId): Promise<Result<string, IntegracionError>>;
  registrarCampania(tenantId: TenantId, data: Record<string, unknown>): Promise<Result<void, IntegracionError>>;
}

export interface POSGateway {
  enviarRecibo(tenantId: TenantId, orderId: string, channel: string): Promise<Result<void, IntegracionError>>;
  obtenerHistorial(tenantId: TenantId, contactId: ContactId): Promise<Result<Record<string, unknown>[], IntegracionError>>;
}

export interface TABLEGateway {
  verificarDisponibilidad(tenantId: TenantId, datetime: string, partySize: number): Promise<Result<boolean, IntegracionError>>;
  crearReserva(tenantId: TenantId, datetime: string, partySize: number, contactId: ContactId): Promise<Result<string, IntegracionError>>;
}

export interface HEALTHGateway {
  buscarSesiones(tenantId: TenantId, professionalId: string, dateRange: string): Promise<Result<Record<string, unknown>[], IntegracionError>>;
  agendarSesion(tenantId: TenantId, professionalId: string, datetime: string, contactId: ContactId): Promise<Result<string, IntegracionError>>;
}

export interface HOMEGateway {
  obtenerPropiedad(tenantId: TenantId, propertyId: string): Promise<Result<Record<string, unknown>, IntegracionError>>;
  crearTicket(tenantId: TenantId, propertyId: string, description: string): Promise<Result<string, IntegracionError>>;
}

export interface FLEETGateway {
  obtenerEstadoEntrega(tenantId: TenantId, orderId: string): Promise<Result<Record<string, unknown>, IntegracionError>>;
  notificarDemora(tenantId: TenantId, orderId: string, newEta: string): Promise<Result<void, IntegracionError>>;
}

export type IntegracionError =
  | { readonly kind: "integration_not_configured" }
  | { readonly kind: "integration_not_active" }
  | { readonly kind: "provider_unavailable" }
  | { readonly kind: "sync_failed"; readonly cause: string };