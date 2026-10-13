import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  WhatsAppTemplateState,
  WhatsAppButton,
  crearWhatsAppTemplate,
  TemplateError,
} from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";

/* ──────────────────────────────────────────
   Comando: crear plantilla WhatsApp
   ────────────────────────────────────────── */
export interface CreateTemplateCommand {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly language: string;
  readonly category: "marketing" | "utility" | "authentication";
  readonly body: string;
  readonly header?: { type: "text" | "image" | "video" | "document" | "location" | "none"; content?: string };
  readonly footer?: string;
  readonly buttons?: readonly WhatsAppButton[];
}

export type CreateTemplateError = TemplateError | RepoError;

/* ──────────────────────────────────────────
   Handler
   ────────────────────────────────────────── */
export class CreateTemplateHandler {
  constructor(private readonly templateRepo: WhatsAppTemplateRepository) {}

  async ejecutar(cmd: CreateTemplateCommand): Promise<Result<string, CreateTemplateError>> {
    const result = crearWhatsAppTemplate(
      cmd.tenantId,
      cmd.name,
      cmd.language,
      cmd.category,
      cmd.body,
      cmd.header,
      cmd.footer,
      cmd.buttons,
    );
    if (!result.ok) return err(result.error);

    const guardarResult = await this.templateRepo.guardar(result.value);
    if (!guardarResult.ok) return err(guardarResult.error);

    return ok(result.value.id);
  }
}