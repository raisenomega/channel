import { Result, err, ok } from "../../shared/domain/result.ts";
import { TemplateStatus, TemplateError } from "./template-types.ts";

type TransitionMap = Partial<Record<TemplateStatus, readonly TemplateStatus[]>>;

const TRANSITIONS: TransitionMap = {
  draft:       ["pending"],
  pending:     ["approved", "rejected"],
  approved:    ["paused", "disabled"],
  rejected:    ["draft", "disabled"],
  paused:      ["approved", "disabled"],
  disabled:    [],
};

export const transicionarStatus = (
  current: TemplateStatus,
  target: TemplateStatus,
): Result<TemplateStatus, TemplateError> => {
  const allowed = TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return err({ kind: "transicion_invalida", from: current, to: target });
  }
  return ok(target);
};