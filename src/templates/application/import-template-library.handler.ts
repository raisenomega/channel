/**
 * HUB by Raisen — Importar plantilla desde la biblioteca de Zernio (Slide 4.9).
 * Crea local con status "approved" tras import exitoso. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { WhatsAppTemplateState, crearWhatsAppTemplate, TemplateError } from "../domain/template.entity.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";
import { importarLibraryZernio as importarZernioLibrary } from "../infrastructure/zernio-templates.client.ts";

export interface ImportTemplateLibraryCommand {
  readonly tenantId: TenantId;
  readonly libraryTemplateName: string;
  readonly category: string | undefined;
  readonly language: string;
  readonly body: string | undefined;
}

export type ImportError =
  | { readonly kind: "library_template_not_found" }
  | { readonly kind: "zernio_error"; readonly cause: string }
  | TemplateError
  | RepoError;

export class ImportTemplateLibraryHandler {
  constructor(
    private readonly repo: WhatsAppTemplateRepository,
    private readonly apiKeyFn: () => string,
    private readonly accountIdFn: (tenantId: string) => Promise<string | null>,
  ) {}

  async ejecutar(cmd: ImportTemplateLibraryCommand): Promise<Result<WhatsAppTemplateState, ImportError>> {
    const apiKey = this.apiKeyFn();
    const accountId = await this.accountIdFn(String(cmd.tenantId));
    if (!accountId) return err({ kind: "zernio_error", cause: "whatsapp_no_conectado" });
    const category = cmd.category ?? "utility";
    const zr = await importarZernioLibrary(apiKey, accountId, cmd.libraryTemplateName, category, cmd.language);
    if (!zr.ok) {
      if (zr.error.kind === "http_failure" && zr.error.status === 404) {
        return err({ kind: "library_template_not_found" });
      }
      return err({ kind: "zernio_error", cause: zr.error.kind === "red" ? zr.error.causa : zr.error.kind });
    }

    const created = crearWhatsAppTemplate(
      cmd.tenantId, cmd.libraryTemplateName, cmd.language, category as never,
      cmd.body ?? "Plantilla de biblioteca",
    );
    if (!created.ok) return err(created.error);

    const approved: WhatsAppTemplateState = Object.freeze({ ...created.value, status: "approved", updatedAt: new Date() });
    const r = await this.repo.guardar(approved);
    if (!r.ok) return err(r.error);
    return ok(approved);
  }
}