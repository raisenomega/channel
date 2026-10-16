/**
 * HUB by Raisen — Tool Executor (Slide 4.1, application). Fast-fail seguro.
 * validar -> despachar -> Result<T, ToolError>. Nunca lanza excepciones. C4 ≤75.
 */
import { CORE_TOOL_SPECS } from "../domain/tool.registry.core.ts";
import { evaluarPolicy, type PolicyContext, type PolicyRejection } from "../domain/tool-policy.ts";
import { TOOL_HANDLERS } from "./handlers.registry.ts";
import { Result, ok, err } from "../../shared/domain/result.ts";

export type ToolError =
  | { readonly kind: "TOOL_DESCONOCIDO"; readonly nombre: string }
  | { readonly kind: "POLICY_RECHAZO"; readonly rechazo: PolicyRejection }
  | { readonly kind: "HANDLER_NO_IMPLEMENTADO"; readonly nombre: string }
  | { readonly kind: "HANDLER_ERROR"; readonly nombre: string; readonly causa: string };

export type ToolHandler = (
  params: Readonly<Record<string, unknown>>,
) => Promise<Result<unknown, { readonly kind: "HANDLER_ERROR"; readonly causa: string }>>;

export class ToolExecutor {
  async ejecutar(
    nombre: string,
    params: Readonly<Record<string, unknown>>,
    ctx: PolicyContext,
  ): Promise<Result<unknown, ToolError>> {
    const spec = CORE_TOOL_SPECS.find((s) => s.nombre === nombre);
    if (!spec) return err({ kind: "TOOL_DESCONOCIDO", nombre });
    const policy = evaluarPolicy(spec, ctx);
    if (!policy.ok) return err({ kind: "POLICY_RECHAZO", rechazo: policy.error });
    const handler = TOOL_HANDLERS[nombre];
    if (!handler) return err({ kind: "HANDLER_NO_IMPLEMENTADO", nombre });
    try {
      const r = await handler(params);
      return r.ok ? ok(r.value) : err({ kind: "HANDLER_ERROR", nombre, causa: r.error.causa });
    } catch {
      return err({ kind: "HANDLER_ERROR", nombre, causa: "handler_lanzo_error" });
    }
  }
}