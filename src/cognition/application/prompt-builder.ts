import { Result } from "../../shared/domain/result.ts";
import { AICompletionParams, AICompletionResult, AIError } from "../domain/ai-provider.ts";
import { AIProviderRegistry, RegistryError } from "../domain/ai-provider-registry.ts";

export type ModelProvider = "anthropic" | "deepseek" | "qwen";

type MessageRole = AICompletionParams["messages"][number]["role"];

export const buildSystemPrompt = (
  brandVoice: string,
  catalogContext: string,
  vertical: string,
  autonomyMode: string,
  providerName: string,
  modelName: string,
): string => [
  `Eres el agente IA de HUB by Raisen, la capa comunicacional del negocio.`,
  ``,
  `Brand Voice del negocio: ${brandVoice}`,
  `Catalogo disponible: ${catalogContext}`,
  `Autonomia actual: ${autonomyMode}`,
  `Proveedor IA: ${providerName} | Modelo: ${modelName}`,
  ``,
  `Reglas inmutables:`,
  `1. NUNCA mentir sobre ser humano si te preguntan directamente.`,
  `2. NUNCA hacer cobros sin confirmacion explicita del contacto.`,
  `3. NUNCA operar contra el interes economico del contacto.`,
  `4. NUNCA compartir informacion privada de un contacto con otro.`,
  `5. NUNCA operar fuera del scope autorizado por el tenant.`,
  `6. SIEMPRE escalar a humano ante queja, urgencia medica, riesgo legal.`,
  `7. SIEMPRE registrar TODO en agent_interactions.`,
].join("\n");

export async function completarConProvider(
  registry: AIProviderRegistry,
  provider: ModelProvider,
  systemPrompt: string,
  messages: readonly { role: string; content: string }[],
): Promise<Result<AICompletionResult, AIError | RegistryError>> {
  const params: AICompletionParams = {
    systemPrompt,
    messages: messages.map((m) => ({ role: m.role as MessageRole, content: m.content })),
    tools: null,
    maxTokens: 4096,
    temperature: 0.7,
  };
  return registry.completarConFallback(provider, params);
}