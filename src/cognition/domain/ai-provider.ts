import { Result } from "../../shared/domain/result.ts";

export type ProviderType = "anthropic" | "deepseek" | "qwen" | "openai";

export interface AICompletionParams {
  readonly systemPrompt: string;
  readonly cachedSystem?: string; // prefijo ESTATICO a cachear (prompt caching: ~90% mas barato en relecturas)
  readonly messages: readonly AIMessage[];
  readonly tools: readonly unknown[] | null;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly tier?: "haiku" | "sonnet" | "opus";
  readonly images?: readonly { readonly mediaType: string; readonly dataBase64: string }[] | undefined; // vision: imagenes base64 -> bloque image en el ultimo user
}

export interface AIMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface AICompletionResult {
  readonly response: string;
  readonly tokensInput: number;
  readonly tokensOutput: number;
  readonly cacheRead?: number;
  readonly cacheCreation?: number;
  readonly latencyMs: number;
  readonly costUsd: number;
  readonly model: string;
}

export interface AIProvider {
  readonly provider: ProviderType;
  completar(params: AICompletionParams): Promise<Result<AICompletionResult, AIError>>;
  ping(): Promise<Result<boolean, AIError>>;
}

export type AIError =
  | { readonly kind: "authentication_failed" }
  | { readonly kind: "rate_limited"; readonly cause?: string }
  | { readonly kind: "provider_unavailable"; readonly cause?: string }
  | { readonly kind: "timeout"; readonly cause?: string }
  | { readonly kind: "invalid_request"; readonly cause: string }
  | { readonly kind: "unknown"; readonly cause: string };

export interface AIProviderRepository {
  obtenerConfig(tenantId: string): Promise<Result<AIProviderConfig, RepoError>>;
}

export interface AIProviderConfig {
  readonly provider: ProviderType;
  readonly model: string;
  readonly apiKey: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly fallbackProvider: ProviderType | null;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "persistence_failure"; readonly cause: string };