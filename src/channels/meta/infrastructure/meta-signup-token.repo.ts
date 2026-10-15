/**
 * HUB by Raisen — Repositorio de tokens encriptados para Embedded Signup.
 * Wrapper sobre TokenVaultRepository. Sin dynamic imports.
 * C4 ≤75 lineas.
 */
import { err, ok } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";
import { TokenVaultRepository } from "./token-vault.repo.ts";

const vault = new TokenVaultRepository();

export class MetaSignupTokenRepo {
  async guardarToken(signupId: string, tenantId: string, accessToken: string, expiresAt: string): Promise<Result<void, string>> {
    const r = await vault.guardar(signupId, tenantId, accessToken, expiresAt);
    if (!r.ok) return err((r.error as { cause: string }).cause ?? "error_desconocido");
    return ok(undefined);
  }

  async obtenerTokenPlano(signupId: string): Promise<Result<string, string>> {
    const r = await vault.obtenerTokenPlano(signupId);
    if (!r.ok) return err((r.error as { cause?: string; kind: string }).kind ?? "error_vault");
    return ok(r.value);
  }
}