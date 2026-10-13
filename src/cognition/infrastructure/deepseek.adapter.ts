import { Result, err, ok } from "../../shared/domain/result.ts";
import { AIProvider, AICompletionParams, AICompletionResult, AIError } from "../domain/ai-provider.ts";

export class DeepSeekAdapter implements AIProvider {
  readonly provider = "deepseek" as const;

  async completar(params: AICompletionParams): Promise<Result<AICompletionResult, AIError>> {
    const startMs = Date.now();
    try {
      const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: params.systemPrompt },
            ...params.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.7,
        }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(Object.freeze({
        response: String((data.choices as Record<string, unknown>[])?.[0]?.message as Record<string, string>).content ?? "",
        tokensInput: (data.usage as Record<string, number>)?.prompt_tokens ?? 0,
        tokensOutput: (data.usage as Record<string, number>)?.completion_tokens ?? 0,
        latencyMs: Date.now() - startMs,
        costUsd: 0,
        model: "deepseek-chat",
      }));
    } catch (e) {
      return err({ kind: "unknown", cause: String(e) });
    }
  }

  async ping(): Promise<Result<boolean, AIError>> {
    try {
      const resp = await fetch("https://api.deepseek.com/v1/models");
      return ok(resp.ok);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }

  constructor(private readonly apiKey: string) {}
}