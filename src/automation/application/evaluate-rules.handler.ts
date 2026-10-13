import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { Action, Condition } from "../domain/automation.entity.ts";
import { AutomationRuleRepository, RepoError } from "../domain/automation.repository.ts";

export interface EvaluateRulesCommand {
  readonly tenantId: string;
  readonly eventType: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export type EvaluateRulesError = RepoError;

export class EvaluateRulesHandler {
  constructor(private readonly ruleRepo: AutomationRuleRepository) {}

  async ejecutar(cmd: EvaluateRulesCommand): Promise<Result<Action[][], EvaluateRulesError>> {
    const rulesResult = await this.ruleRepo.buscarActivas(cmd.tenantId as TenantId, cmd.eventType);
    if (!rulesResult.ok) return err(rulesResult.error);

    const ejecutadas: Action[][] = [];
    for (const rule of rulesResult.value) {
      const cumple = rule.conditions.length === 0 || rule.conditions.every((c) =>
        this.evaluarCondicion(c, cmd.context),
      );
      if (cumple) ejecutadas.push([...rule.actions]);
    }

    return ok(ejecutadas);
  }

  private evaluarCondicion(c: Condition, ctx: Readonly<Record<string, unknown>>): boolean {
    const valor = ctx[c.field];
    switch (c.operator) {
      case "eq": return valor === c.value;
      case "neq": return valor !== c.value;
      case "contains": return String(valor).includes(String(c.value));
      case "gt": return typeof valor === "number" && typeof c.value === "number" && valor > c.value;
      case "lt": return typeof valor === "number" && typeof c.value === "number" && valor < c.value;
      case "in": return Array.isArray(c.value) && c.value.includes(valor);
      default: return false;
    }
  }
}