/**
 * HUB by Raisen — Repositorio Supabase de agent_drafts (Slide 4.2b-1).
 * RLS por tenant_id. Idempotencia por (tenant_id, conversation_id, inbound_message_hash). C4 ≤75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { AgentDraft, DraftStatus } from "../domain/agent-draft.entity.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface Row { id: string; tenant_id: string; conversation_id: string; contact_id: string; persona_slug: string; inbound_message: string; inbound_message_hash: string; draft_content: string; confidence: number; reason: string; status: string; ai_disclosure_included: boolean; trace_id: string; metadata: Record<string, unknown>; created_at: string; updated_at: string; }

export class AgentDraftsRepository {
  async insertar(draft: AgentDraft): Promise<Result<AgentDraft, { readonly causa: string }>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ causa: "config_incompleta" });
    try {
      const r = await fetch(`${u}/agent_drafts`, { method: "POST", headers: h, body: JSON.stringify({ id: draft.id, tenant_id: draft.tenantId, conversation_id: draft.conversationId, contact_id: draft.contactId, persona_slug: draft.personaSlug, inbound_message: draft.inboundMessage, inbound_message_hash: crypto.randomUUID(), draft_content: draft.draftContent, confidence: draft.confidence, reason: draft.reason, status: "draft", ai_disclosure_included: draft.aiDisclosureIncluded, trace_id: draft.traceId, metadata: draft.metadata, created_at: draft.createdAt, updated_at: draft.updatedAt }) });
      return r.ok ? ok(draft) : err({ causa: `http_${r.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }

  async listarPendientes(tenantId: TenantId): Promise<Result<readonly AgentDraft[], { readonly causa: string }>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ causa: "config_incompleta" });
    try {
      const r = await fetch(`${u}/agent_drafts?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&status=eq.draft&order=created_at.desc`, { headers: h });
      if (!r.ok) return err({ causa: `http_${r.status}` });
      const rows = await r.json() as Row[];
      return ok(Object.freeze(rows.map((x) => this.toEntity(x))));
    } catch (e) { return err({ causa: String(e) }); }
  }

  async obtenerPorId(id: string): Promise<Result<AgentDraft | null, { readonly causa: string }>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ causa: "config_incompleta" });
    try {
      const r = await fetch(`${u}/agent_drafts?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: h });
      if (!r.ok) return err({ causa: `http_${r.status}` });
      const rows = await r.json() as Row[];
      return ok(rows.length > 0 ? this.toEntity(rows[0]!) : null);
    } catch (e) { return err({ causa: String(e) }); }
  }

  async marcarExpirado(id: string): Promise<Result<void, { readonly causa: string }>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ causa: "config_incompleta" });
    try {
      const r = await fetch(`${u}/agent_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: h, body: JSON.stringify({ status: "expired", updated_at: new Date().toISOString() }) });
      return r.ok ? ok(undefined) : err({ causa: `http_${r.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }

  private toEntity(r: Row): AgentDraft {
    return { id: r.id, tenantId: r.tenant_id as never, conversationId: r.conversation_id as never, contactId: r.contact_id as never, personaSlug: r.persona_slug, inboundMessage: r.inbound_message, draftContent: r.draft_content, confidence: Number(r.confidence), reason: r.reason, status: r.status as DraftStatus, aiDisclosureIncluded: r.ai_disclosure_included, traceId: r.trace_id, metadata: Object.freeze(r.metadata ?? {}), createdAt: r.created_at, updatedAt: r.updated_at };
  }
}