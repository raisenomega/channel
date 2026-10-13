import { Result } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

export class CannedResponseService {
  constructor(private readonly repo: CannedResponseRepository) {}

  async ejecutar(tenantId: TenantId, shortcode: string): Promise<Result<string, CannedError>> {
    const result = await this.repo.buscarPorShortcode(tenantId, shortcode);
    if (!result.ok) return { ok: false, error: { kind: "persistence_failure", cause: causaDe(result.error) } };
    if (!result.value) return { ok: false, error: { kind: "no_encontrado", shortcode } };
    return { ok: true, value: result.value.content };
  }
}

export type CannedError =
  | { readonly kind: "no_encontrado"; readonly shortcode: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

import { CannedResponseRepository } from "../domain/automation.repository.ts";

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}