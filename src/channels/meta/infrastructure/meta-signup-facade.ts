/**
 * HUB by Raisen — Fachada unificada Supabase para Embedded Signup.
 * Implementa EmbeddedSignupRepository, InitSignupRepository, StateResolver.
 * C4 ≤75 lineas.
 */
import { ok } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import { MetaSignupPersistenceRepo } from "./meta-signup-persistence.repo.ts";
import { MetaSignupStateRepo } from "./meta-signup-state.repo.ts";
import { MetaSignupTokenRepo } from "./meta-signup-token.repo.ts";
import type { StateData } from "./meta-signup-state.repo.ts";
import type { EmbeddedSignupRepository } from "../application/embedded-signup.repo.ts";
import type { StateResolver } from "../application/embedded-signup.repo.ts";
import type { InitSignupRepository } from "../application/init-signup.handler.ts";

const persist = new MetaSignupPersistenceRepo();
const stateRepo = new MetaSignupStateRepo();
const token = new MetaSignupTokenRepo();

export class SupabaseMetaSignupFacade implements EmbeddedSignupRepository, InitSignupRepository, StateResolver {
  // EmbeddedSignupRepository
  async buscarPorId(signupId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const r = await persist.buscarPorId(signupId);
    if (!r.ok) return r;
    return ok(r.value ? { id: r.value.id, tenantId: r.value.tenant_id, status: r.value.status as EmbeddedSignupStatus } : null);
  }
  async actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>> { return persist.actualizar(signupId, data); }
  async guardarToken(signupId: string, tenantId: string, accessToken: string, expiresAt: string): Promise<Result<void, string>> { return token.guardarToken(signupId, tenantId, accessToken, expiresAt); }

  // InitSignupRepository
  async guardarState(tenantId: string, stateStr: string, signupId: string, expiresAt: string): Promise<Result<void, string>> { return stateRepo.guardarState(tenantId, stateStr, signupId, expiresAt); }
  async crearSignup(tenantId: string, signupId: string, metaWebhookId: string): Promise<Result<void, string>> { return persist.crearSignup(tenantId, signupId, metaWebhookId); }

  // StateResolver
  async verificarYConsumirState(stateStr: string): Promise<Result<StateData | null, string>> { return stateRepo.verificarYConsumirState(stateStr); }
}