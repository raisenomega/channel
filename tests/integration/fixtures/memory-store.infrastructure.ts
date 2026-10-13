/**
 * HUB by Raisen — Stores en memoria para tests de integracion.
 * Implementan TenantRepository y UserRepository por separado respetando los
 * invariantes de la DB real (slug unico, email unico). Sin dependencias.
 */
import { Result, ok, err } from "../../../src/shared/domain/result.ts";
import { TenantId, UserId } from "../../../src/shared/domain/ids.ts";
import { TenantState } from "../../../src/identity/domain/tenant.entity.ts";
import { UserState } from "../../../src/identity/domain/user.entity.ts";
import {
  TenantRepository,
  UserRepository,
  RepoError,
} from "../../../src/identity/domain/identity.repository.ts";

export class MemoryTenantStore implements TenantRepository {
  private items: TenantState[] = [];

  async guardar(tenant: TenantState): Promise<Result<void, RepoError>> {
    if (this.items.some((t) => t.slug === tenant.slug)) {
      return err({ kind: "duplicado", campo: "slug" });
    }
    this.items.push(tenant);
    return ok(undefined);
  }

  async buscar(id: TenantId): Promise<Result<TenantState | null, RepoError>> {
    return ok(this.items.find((t) => t.id === id) ?? null);
  }

  async buscarPorSlug(slug: string): Promise<Result<TenantState | null, RepoError>> {
    return ok(this.items.find((t) => t.slug === slug) ?? null);
  }

  limpiar(): void {
    this.items = [];
  }
}

export class MemoryUserStore implements UserRepository {
  private items: UserState[] = [];

  async guardar(user: UserState): Promise<Result<void, RepoError>> {
    if (this.items.some((u) => u.email.valor === user.email.valor)) {
      return err({ kind: "duplicado", campo: "email" });
    }
    this.items.push(user);
    return ok(undefined);
  }

  async buscar(id: UserId): Promise<Result<UserState | null, RepoError>> {
    return ok(this.items.find((u) => u.id === id) ?? null);
  }

  async buscarPorTenant(tenantId: TenantId): Promise<Result<UserState[], RepoError>> {
    return ok(this.items.filter((u) => u.tenantId === tenantId));
  }

  async buscarPorEmail(email: string): Promise<Result<UserState | null, RepoError>> {
    return ok(this.items.find((u) => u.email.valor === email) ?? null);
  }

  limpiar(): void {
    this.items = [];
  }
}