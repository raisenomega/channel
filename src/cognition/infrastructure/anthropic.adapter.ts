import { Result, err, ok } from "../../shared/domain/result.ts";
import { AIProvider, AICompletionParams, AICompletionResult, AIError } from "../domain/ai-provider.ts";

export class AnthropicAdapter implements AIProvider {
  readonly provider = "anthropic" as const;

  async completar(params: AICompletionParams): Promise<Result<AICompletionResult, AIError>> {
    const startMs = Date.now();
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          system: params.systemPrompt,
          messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.7,
        }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(Object.freeze({
        response: String((data.content as Record<string, unknown>[])?.[0]?.text ?? ""),
        tokensInput: (data.usage as Record<string, number>)?.input_tokens ?? 0,
        tokensOutput: (data.usage as Record<string, number>)?.output_tokens ?? 0,
        latencyMs: Date.now() - startMs,
        costUsd: 0,
        model: "claude-sonnet-4-6",
      }));
    } catch (e) {
      return err({ kind: "unknown", cause: String(e) });
    }
  }

  async ping(): Promise<Result<boolean, AIError>> {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
      });
      return ok(resp.ok);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }

  constructor(private readonly apiKey: string) {}
}