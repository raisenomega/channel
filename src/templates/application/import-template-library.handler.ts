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
  ) {}

  async ejecutar(cmd: ImportTemplateLibraryCommand): Promise<Result<WhatsAppTemplateState, ImportError>> {
    const apiKey = this.apiKeyFn();
    const zr = await importarZernioLibrary(apiKey, cmd.libraryTemplateName, cmd.language);
    if (!zr.ok) {
      if (zr.error.kind === "http_failure" && zr.error.status === 404) {
        return err({ kind: "library_template_not_found" });
      }
      return err({ kind: "zernio_error", cause: zr.error.kind === "red" ? zr.error.causa : zr.error.kind });
    }

    const created = crearWhatsAppTemplate(
      cmd.tenantId, cmd.libraryTemplateName, cmd.language, "utility",
      cmd.body ?? "Plantilla de biblioteca",
    );
    if (!created.ok) return err(created.error);

    const approved: WhatsAppTemplateState = Object.freeze({ ...created.value, status: "approved", updatedAt: new Date() });
    const r = await this.repo.guardar(approved);
    if (!r.ok) return err(r.error);
    return ok(approved);
  }
}