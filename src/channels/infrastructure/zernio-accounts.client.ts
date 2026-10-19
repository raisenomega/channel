/**
 * HUB by Raisen — Cliente Zernio GET /v1/accounts (Hotfix G, decision D4).
 * OpenAPI real de Zernio (docs.zernio.com/api/openapi): filtros `platform` y `profileId`.
 * NO existe filtro tenant_id ni la ruta /v1/connected-accounts que usaba HUB.
 * Por eso el aislamiento R20 se garantiza AQUI en JS: solo pasan las cuentas cuyo id
 * esta enlazado al tenant en channel_connections. Sin enlaces -> lista vacia. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { ChannelConnection } from "../domain/social-account.entity.ts";

export interface ZernioAccount {
  readonly zernioAccountId: string;
  readonly platform: string;
  readonly handle: string | null;
  readonly followersCount: number | null;
  readonly status: "connected" | "awaiting";
}

interface RawAccount {
  _id?: string; id?: string; zernio_account_id?: string; platform?: string;
  username?: string; handle?: string; followers_count?: number; followersCount?: number;
  isActive?: boolean; status?: string;
}

export const ZERNIO_ACCOUNTS_URL = "https://api.zernio.io/v1/accounts";

/** Acepta el shape real de Zernio (_id/username/isActive) y el legacy (zernio_account_id/handle/status). */
export function normalizarCuenta(a: RawAccount): ZernioAccount | null {
  const id = a._id ?? a.id ?? a.zernio_account_id;
  if (!id || !a.platform) return null;
  const activa = a.isActive === true || a.status === "connected";
  return Object.freeze({
    zernioAccountId: String(id),
    platform: a.platform,
    handle: a.username ?? a.handle ?? null,
    followersCount: a.followers_count ?? a.followersCount ?? null,
    status: activa ? "connected" : "awaiting",
  });
}

export async function listarCuentasZernio(apiKey: string, platform?: string): Promise<Result<readonly ZernioAccount[], "zernio_error">> {
  const url = platform ? `${ZERNIO_ACCOUNTS_URL}?platform=${encodeURIComponent(platform)}` : ZERNIO_ACCOUNTS_URL;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return err("zernio_error");
    const data = await r.json() as { accounts?: RawAccount[]; items?: RawAccount[] };
    const raw = data.accounts ?? data.items ?? [];
    return ok(Object.freeze(raw.map(normalizarCuenta).filter((x): x is ZernioAccount => x !== null)));
  } catch { return err("zernio_error"); }
}

/** R20: solo cuentas enlazadas al tenant (channel_connections.zernio_account_id). El filtro por
 * status (desconectado = no usable) lo aplica el CALLER (connected-accounts), NO aqui: zernio-sync
 * necesita ver TODAS las enlazadas para reconciliar su status real desde Zernio. */
export function filtrarPorTenant(cuentas: readonly ZernioAccount[], enlaces: readonly ChannelConnection[]): readonly ZernioAccount[] {
  const propias = new Set(enlaces.map((c) => c.zernioAccountId).filter((x): x is string => !!x));
  return Object.freeze(cuentas.filter((c) => propias.has(c.zernioAccountId)));
}
