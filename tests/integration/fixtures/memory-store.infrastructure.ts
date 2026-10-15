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

// ────────────────────────────────────────────
// Commerce stores
// ────────────────────────────────────────────

import type { QuoteState } from "../../../src/commerce/domain/quote.entity.ts";
import type { OrderState } from "../../../src/commerce/domain/order.entity.ts";
import type {
  QuoteRepository,
  OrderRepository,
} from "../../../src/commerce/domain/commerce.repository.ts";
import type { RepoError as CommerceRepoError } from "../../../src/commerce/domain/commerce.repository.ts";
import type { QuoteId, OrderId, ContactId } from "../../../src/shared/domain/ids.ts";

export class MemoryQuoteStore implements QuoteRepository {
  private items: QuoteState[] = [];

  async guardar(quote: QuoteState): Promise<Result<void, CommerceRepoError>> {
    const idx = this.items.findIndex((q) => q.id === quote.id);
    if (idx >= 0) {
      this.items[idx] = quote;
    } else {
      this.items.push(quote);
    }
    return ok(undefined);
  }

  async buscar(id: QuoteId, _tenantId: TenantId): Promise<Result<QuoteState | null, CommerceRepoError>> {
    return ok(this.items.find((q) => q.id === id) ?? null);
  }

  limpiar(): void {
    this.items = [];
  }
}

export class MemoryOrderStore implements OrderRepository {
  private items: OrderState[] = [];

  async guardar(order: OrderState): Promise<Result<void, CommerceRepoError>> {
    const idx = this.items.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.items[idx] = order;
    } else {
      this.items.push(order);
    }
    return ok(undefined);
  }

  async buscar(id: OrderId, _tenantId: TenantId): Promise<Result<OrderState | null, CommerceRepoError>> {
    return ok(this.items.find((o) => o.id === id) ?? null);
  }

  async buscarPorContacto(contactId: ContactId, _tenantId: TenantId): Promise<Result<OrderState[], CommerceRepoError>> {
    return ok(this.items.filter((o) => o.contactId === contactId));
  }

  limpiar(): void {
    this.items = [];
  }
}

// ────────────────────────────────────────────
// Inbox stores
// ────────────────────────────────────────────

import type { ConversationState } from "../../../src/inbox/domain/conversation.entity.ts";
import type { MessageState } from "../../../src/inbox/domain/message.entity.ts";
import type {
  ConversationRepository,
  MessageRepository,
} from "../../../src/inbox/domain/inbox.repository.ts";
import type { RepoError as InboxRepoError } from "../../../src/inbox/domain/inbox.repository.ts";
import type { ConversationId, MessageId, TenantId, ContactId } from "../../../src/shared/domain/ids.ts";

export class MemoryConversationStore implements ConversationRepository {
  private items: ConversationState[] = [];

  async guardar(conv: ConversationState): Promise<Result<void, InboxRepoError>> {
    const idx = this.items.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      this.items[idx] = conv;
    } else {
      this.items.push(conv);
    }
    return ok(undefined);
  }

  async buscar(id: ConversationId): Promise<Result<ConversationState | null, InboxRepoError>> {
    return ok(this.items.find((c) => c.id === id) ?? null);
  }

  async buscarPorContacto(tenantId: TenantId, contactId: ContactId): Promise<Result<ConversationState[], InboxRepoError>> {
    return ok(this.items.filter((c) => c.tenantId === tenantId && c.contactId === contactId));
  }

  async buscarActivos(tenantId: TenantId): Promise<Result<ConversationState[], InboxRepoError>> {
    return ok(this.items.filter((c) => c.tenantId === tenantId && c.status !== "archived"));
  }

  limpiar(): void {
    this.items = [];
  }
}

export class MemoryMessageStore implements MessageRepository {
  private items: MessageState[] = [];

  async guardar(msg: MessageState): Promise<Result<void, InboxRepoError>> {
    this.items.push(msg);
    return ok(undefined);
  }

  async buscar(id: MessageId): Promise<Result<MessageState | null, InboxRepoError>> {
    return ok(this.items.find((m) => m.id === id) ?? null);
  }

  async buscarPorConversacion(convId: ConversationId, _limit = 50): Promise<Result<MessageState[], InboxRepoError>> {
    return ok(this.items.filter((m) => m.conversationId === convId).slice(0, _limit));
  }

  limpiar(): void {
    this.items = [];
  }
}

// ────────────────────────────────────────────
// Compliance stores
// ────────────────────────────────────────────

import type { ConsentRecord, AuditEntry } from "../../../src/compliance/domain/compliance.entity.ts";
import type {
  ConsentRepository,
  AuditRepository,
  AuditQuery,
} from "../../../src/compliance/domain/compliance.repository.ts";
import type { RepoError as ComplianceRepoError } from "../../../src/compliance/domain/compliance.repository.ts";
import type { ChannelType } from "../../../src/compliance/domain/compliance.types.ts";
import type { TenantId, ContactId } from "../../../src/shared/domain/ids.ts";

export class MemoryConsentStore implements ConsentRepository {
  private items: ConsentRecord[] = [];

  async guardar(record: ConsentRecord): Promise<Result<void, ComplianceRepoError>> {
    this.items.push(record);
    return ok(undefined);
  }

  async buscarUltimo(
    tenantId: TenantId,
    contactId: ContactId,
    channel: ChannelType,
  ): Promise<Result<ConsentRecord | null, ComplianceRepoError>> {
    const matches = this.items.filter(
      (r) => r.tenantId === tenantId && r.contactId === contactId && r.channel === channel,
    );
    matches.sort((a, b) => {
      const timeDiff = b.consentedAt.getTime() - a.consentedAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      // Tiebreak: insercion mas tarde gana (desambiguacion para timestamps iguales)
      return this.items.indexOf(b) - this.items.indexOf(a);
    });
    return ok(matches[0] ?? null);
  }

  limpiar(): void {
    this.items = [];
  }
}

export class MemoryAuditStore implements AuditRepository {
  private items: AuditEntry[] = [];

  async guardar(entry: AuditEntry): Promise<Result<void, ComplianceRepoError>> {
    this.items.push(entry);
    return ok(undefined);
  }

  async buscar(tenantId: TenantId, options: AuditQuery): Promise<Result<AuditEntry[], ComplianceRepoError>> {
    let results = this.items.filter((e) => e.tenantId === tenantId);
    if (options.action) results = results.filter((e) => e.action === options.action);
    if (options.resource) results = results.filter((e) => e.resource === options.resource);
    if (options.actorId) results = results.filter((e) => e.actorId === options.actorId);
    if (options.from) results = results.filter((e) => e.createdAt >= options.from!);
    if (options.to) results = results.filter((e) => e.createdAt <= options.to!);
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return ok(results.slice(0, options.limit ?? 50));
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