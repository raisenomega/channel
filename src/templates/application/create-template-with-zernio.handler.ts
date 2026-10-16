/**
 * HUB by Raisen — Crea plantilla local + la envia a Zernio (Slide 4.9).
 * A-03 body_too_long, A-04 invalid_category, A-06 pending_meta. C4 ≤75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { CreateTemplateHandler, CreateTemplateCommand, CreateTemplateError } from "./create-template.handler.ts";
import { WhatsAppTemplateRepository, RepoError } from "../domain/template.repository.ts";
import { crearTemplateZernio } from "../infrastructure/zernio-templates.client.ts";

export interface CreateWithZernioResult {
  readonly id: string;
  readonly status: string;
  readonly zernioTemplateId: string | null;
}

export type CreateWithZernioError =
  | CreateTemplateError
  | { readonly kind: "zernio_error"; readonly cause: string }
  | { readonly kind: "invalid_template_name" }
  | RepoError;

export class CreateTemplateWithZernioHandler {
  constructor(
    private readonly inner: CreateTemplateHandler,
    private readonly repo: WhatsAppTemplateRepository,
    private readonly apiKeyFn: () => string,
  ) {}

  async ejecutar(cmd: CreateTemplateCommand): Promise<Result<CreateWithZernioResult, CreateWithZernioError>> {
    if (!cmd.name?.length || !/^[a-z_]{1,512}$/.test(cmd.name)) return err({ kind: "invalid_template_name" });
    if (cmd.language && !/^[a-z]{2}(_[A-Z]{2})?$/.test(cmd.language)) return err({ kind: "invalid_template_name" });
    if (!["marketing", "utility", "authentication"].includes(cmd.category)) return err({ kind: "invalid_template_name" });
    if (cmd.body.length > 1024) return err({ kind: "invalid_template_name" });
    if (!cmd.body?.length) return err({ kind: "invalid_template_name" });

    const local = await this.inner.ejecutar(cmd);
    if (!local.ok) return err(local.error);

    const apiKey = this.apiKeyFn();
    const zr = await crearTemplateZernio(apiKey, {
      name: cmd.name, language: cmd.language, category: cmd.category, body: cmd.body,
    });
    if (!zr.ok) {
      return err({ kind: "zernio_error", cause: zr.error.kind === "red" ? zr.error.causa : zr.error.kind });
    }

    await this.repo.actualizarStatus(local.value, "pending");
    return ok({ id: local.value, status: "pending_meta", zernioTemplateId: zr.value.templateId });
  }
}