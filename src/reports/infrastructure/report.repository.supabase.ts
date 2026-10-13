/**
 * HUB by Raisen — BC reports: repositorio Supabase sobre conversations,
 * messages y agent_interactions. Sin datos mock.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { ReportConfig } from "../domain/report.entity.ts";
import type { ConversationRowForReport, MessageRow, AgentInteractionRow, RawReportData } from "../domain/report.types.ts";
import { ReportRepository, ReportError } from "../domain/report.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

type Row = Record<string, unknown>;

export class ReportRepositorySupabase implements ReportRepository {
  async loadRaw(cfg: ReportConfig): Promise<Result<RawReportData, ReportError>> {
    if (cfg.to.getTime() <= cfg.from.getTime()) return err({ kind: "invalid_range" });
    try {
      const [conv, msg, ai] = await Promise.all([
        this.conversations(cfg), this.messages(cfg), this.interactions(cfg),
      ]);
      return ok({ conversations: conv, messages: msg, agentInteractions: ai });
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }

  private async conversations(cfg: ReportConfig): Promise<ConversationRowForReport[]> {
    const { data, error } = await this.scoped("conversations", cfg);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Row) => ({
      id: String(r.id), primaryChannel: String(r.primary_channel),
      status: String(r.status), operationMode: String(r.operation_mode),
      aiMessages: num(r.ai_messages), humanMessages: num(r.human_messages),
      slaViolated: bool(r.sla_violated), resolvedAt: r.resolved_at == null ? null : String(r.resolved_at),
      createdAt: String(r.created_at),
    }));
  }

  private async messages(cfg: ReportConfig): Promise<MessageRow[]> {
    const { data, error } = await this.scoped("messages", cfg);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Row) => ({
      id: String(r.id),
      conversationId: String(r.conversation_id) as MessageRow["conversationId"],
      tenantId: String(r.tenant_id) as MessageRow["tenantId"],
      direction: String(r.direction) as MessageRow["direction"],
      senderType: String(r.sender_type) as MessageRow["senderType"],
      channel: String(r.channel), status: String(r.status),
      aiConfidence: numOrNull(r.ai_confidence), aiMode: r.ai_mode == null ? null : String(r.ai_mode),
      createdAt: new Date(String(r.created_at)),
    }));
  }
  private async interactions(cfg: ReportConfig): Promise<AgentInteractionRow[]> {
    const { data, error } = await this.scoped("agent_interactions", cfg);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Row) => ({
      id: String(r.id), conversationId: String(r.conversation_id) as AgentInteractionRow["conversationId"],
      tenantId: String(r.tenant_id) as AgentInteractionRow["tenantId"],
      contactId: String(r.contact_id) as AgentInteractionRow["contactId"],
      channel: String(r.channel), wasCorrect: r.was_correct == null ? null : bool(r.was_correct),
      confidencePost: numOrNull(r.confidence_post), latencyMs: numOrNull(r.latency_ms),
      tokensInput: numOrNull(r.tokens_input), tokensOutput: numOrNull(r.tokens_output),
      costUsd: numOrNull(r.cost_usd), createdAt: new Date(String(r.created_at)),
    }));
  }
  private scoped(table: string, cfg: ReportConfig) {
    let q = supabase.from(table).select("*").eq("tenant_id", cfg.tenantId)
      .gte("created_at", cfg.from.toISOString()).lte("created_at", cfg.to.toISOString());
    if (cfg.channel) q = q.eq("channel", cfg.channel);
    return q;
  }
}

function num(v: unknown): number { return typeof v === "number" ? v : Number(v ?? 0); }
function numOrNull(v: unknown): number | null { return v == null ? null : num(v); }
function bool(v: unknown): boolean { return v === true || String(v) === "true"; }