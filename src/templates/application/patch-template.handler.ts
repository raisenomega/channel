/**
 * HUB by Raisen — Editar localmente una plantilla aprobada (Slide 4.9).
 * No llama a Zernio; la ruta mapea 429 si hubiera. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { WhatsAppTemplateState } from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";

export interface PatchTemplateCommand {
  readonly tenantId: TenantId;
  readonly templateName: string;
  readonly edits: {
    readonly body: string | undefined;
    readonly category: ("marketing" | "utility" | "authentication") | undefined;
    readonly footer: string | undefined;
    readonly header: { readonly type: string; readonly content?: string } | undefined;
  };
}

export type PatchError =
  | { readonly kind: "not_found" }
  | { readonly kind: "template_not_editable" }
  | RepoError;

export class PatchTemplateHandler {
  constructor(
    private readonly repo: WhatsAppTemplateRepository,
    private readonly _apiKeyFn: () => string,
  ) {}

  async ejecutar(cmd: PatchTemplateCommand): Promise<Result<WhatsAppTemplateState, PatchError>> {
    const todos = await this.repo.buscarPorTenant(cmd.tenantId);
    if (!todos.ok) return err(todos.error);
    const t = todos.value.find((x) => x.name === cmd.templateName);
    if (!t) return err({ kind: "not_found" });
    if (t.status !== "approved") return err({ kind: "template_not_editable" });

    const updated: WhatsAppTemplateState = Object.freeze({
      ...t,
      body: cmd.edits.body ?? t.body,
      category: cmd.edits.category ?? t.category,
      footer: cmd.edits.footer ?? t.footer,
      header: cmd.edits.header
        ? Object.freeze({ type: cmd.edits.header.type as "text" | "image" | "video" | "document" | "location" | "none", content: cmd.edits.header.content ?? null })
        : t.header,
      updatedAt: new Date(),
    });

    const r = await this.repo.guardar(updated);
    if (!r.ok) return err(r.error);
    return ok(updated);
  }
}