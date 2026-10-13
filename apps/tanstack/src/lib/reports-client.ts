/**
 * HUB by Raisen — Cliente de reportes y KPIS agregados.
 * Queries reales a Supabase REST (conversations, messages, agent_interactions).
 * Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export type ReportError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: ReportError };

export interface ReportKpis {
  totalConversations: number;
  totalMessages: number;
  closeRate: number | null;
  wasCorrectAvg: number | null;
}

export async function fetchReportKpis(): Promise<Result<ReportKpis>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };

  try {
    const [convRes, msgRes, aiRes] = await Promise.all([
      fetch(`${base}/conversations?select=id,status`, { headers }),
      fetch(`${base}/messages?select=id`, { headers }),
      fetch(`${base}/agent_interactions?select=was_correct`, { headers }),
    ]);

    if (!convRes.ok || !msgRes.ok || !aiRes.ok) {
      return { ok: false, error: { kind: "red", cause: "status error" } };
    }

    const conversations = (await convRes.json()) as Array<{ id: string; status: string }>;
    const messages = (await msgRes.json()) as Array<{ id: string }>;
    const interactions = (await aiRes.json()) as Array<{ was_correct: boolean | null }>;

    const totalConversations = conversations.length;
    const totalMessages = messages.length;
    const closed = conversations.filter((c) => c.status === "resolved" || c.status === "closed").length;
    const closeRate = totalConversations > 0 ? (closed / totalConversations) * 100 : null;

    const correctos = interactions.filter((i) => i.was_correct === true).length;
    const wasCorrectAvg = interactions.length > 0 ? (correctos / interactions.length) * 100 : null;

    return {
      ok: true,
      value: {
        totalConversations,
        totalMessages,
        closeRate,
        wasCorrectAvg,
      },
    };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}