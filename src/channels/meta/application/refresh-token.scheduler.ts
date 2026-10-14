/**
 * HUB by Raisen — RefreshTokenScheduler: refresca el System User Token
 * de Meta antes de que expire (cada 60 días). Corre como schedule de Supabase.
 * C4 ≤75 líneas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";

export interface TokenToRefresh {
  readonly signupId: string;
  readonly tenantId: string;
  readonly currentEncryptedToken: string;
  readonly expiresAt: string;
}

export type RefreshTokenError =
  | { readonly kind: "sin_tokens_para_refrescar" }
  | { readonly kind: "refresh_fallo"; readonly cause: string };

export interface TokenRefreshClient {
  refrescar(tenantSystemUserId: string): Promise<Result<{ accessToken: string; expiresAt: string }, string>>;
}

export interface TokenVaultRepository {
  listarTokensPorExpirar(limite: number): Promise<Result<TokenToRefresh[], string>>;
  rotarToken(signupId: string, tenantId: string, encryptedToken: string, iv: string, tag: string, nuevaExp: string): Promise<Result<void, string>>;
}

export class RefreshTokenScheduler {
  constructor(
    private readonly metaClient: TokenRefreshClient,
    private readonly vaultRepo: TokenVaultRepository,
  ) {}

  static readonly DIAS_ANTES_EXPIRACION = 7;
  static readonly LIMITE_POR_LOTE = 50;

  async ejecutar(): Promise<Result<{ refrescados: number }, RefreshTokenError>> {
    const tokens = await this.vaultRepo.listarTokensPorExpirar(RefreshTokenScheduler.LIMITE_POR_LOTE);
    if (!tokens.ok) return err({ kind: "sin_tokens_para_refrescar" });

    let refrescados = 0;
    for (const t of tokens.value) {
      const refreshed = await this.metaClient.refrescar(t.currentEncryptedToken);
      if (!refreshed.ok) continue;

      const tokenEncriptado = refreshed.value.accessToken; // placeholder: encriptacion real en vault
      const rotado = await this.vaultRepo.rotarToken(
        t.signupId, t.tenantId,
        tokenEncriptado, "", "",
        refreshed.value.expiresAt,
      );
      if (rotado.ok) refrescados++;
    }

    return ok({ refrescados });
  }
}