import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId, QuoteId } from "../../shared/domain/ids.ts";
import { NUCLEOGateway, IntegracionError } from "../domain/integration.gateways.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class NucleoAdapter implements NUCLEOGateway {
  async syncContact(tenantId: TenantId, contactId: ContactId): Promise<Result<void, IntegracionError>> {
    try {
      const { error } = await supabase.rpc("nucleo_sync_contact", {
        p_tenant_id: tenantId, p_contact_id: contactId,
      });
      if (error) return err({ kind: "sync_failed", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "sync_failed", cause: String(e) });
    }
  }

  async crearFactura(tenantId: TenantId, quoteId: QuoteId): Promise<Result<string, IntegracionError>> {
    try {
      const { data, error } = await supabase.rpc("nucleo_create_invoice", {
        p_tenant_id: tenantId, p_quote_id: quoteId,
      });
      if (error) return err({ kind: "sync_failed", cause: error.message });
      return ok(String(data));
    } catch (e) {
      return err({ kind: "sync_failed", cause: String(e) });
    }
  }

  async obtenerContacto(tenantId: TenantId, nucleoCustomerId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    try {
      const { data, error } = await supabase.rpc("nucleo_get_customer", {
        p_tenant_id: tenantId, p_nucleo_id: nucleoCustomerId,
      });
      if (error) return err({ kind: "sync_failed", cause: error.message });
      return ok(data as Record<string, unknown> ?? {});
    } catch (e) {
      return err({ kind: "sync_failed", cause: String(e) });
    }
  }
}