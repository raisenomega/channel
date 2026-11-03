/**
 * HUB by Raisen — Cliente HTTP de Templates de Zernio. Crear e importar: POST /v1/whatsapp/templates.
 * components via construirComponents (body/header/buttons, forma verificada). C4 <=75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { conReintentos, RetryConfig } from "../../channels/infrastructure/zernio.retry.ts";
import { construirComponents, ZernioHeaderIn, ZernioButtonIn } from "./zernio-template-components.ts";

const RETRY_CFG: RetryConfig = Object.freeze({ maxIntentos: 3, backoffBaseMs: 800 });
const BASE = "https://zernio.com/api";

export interface ZernioTemplatePayload {
  readonly accountId: string;
  readonly name: string;
  readonly language: string;
  readonly category: string;
  readonly body: string;
  readonly header?: ZernioHeaderIn | undefined;
  readonly buttons?: readonly ZernioButtonIn[] | undefined;
}

export type ZernioTemplatesError =
  | { readonly kind: "credencial_ausente" }
  | { readonly kind: "http_failure"; readonly status: number }
  | { readonly kind: "red"; readonly causa: string }
  | { readonly kind: "retry_agotado"; readonly reason: string };

async function postTemplate(
  apiKey: string,
  reqBody: Record<string, unknown>,
): Promise<Result<number, ZernioTemplatesError>> {
  const r = await conReintentos(async () => {
    try {
      const res = await fetch(`${BASE}/v1/whatsapp/templates`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(reqBody),
      });
      return res.ok ? ok({ status: res.status }) : err({ causa: `http_${res.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }, RETRY_CFG);
  if (!r.ok) return err({ kind: "retry_agotado", reason: r.error.ultimo_error });
  return ok(r.value.status);
}

export async function crearTemplateZernio(
  apiKey: string,
  payload: ZernioTemplatePayload,
): Promise<Result<{ readonly templateId: string | null }, ZernioTemplatesError>> {
  if (!apiKey || !payload.accountId) return err({ kind: "credencial_ausente" });
  const r = await postTemplate(apiKey, {
    accountId: payload.accountId, name: payload.name, language: payload.language,
    category: payload.category.toUpperCase(),
    components: construirComponents(payload.body, payload.header, payload.buttons),
  });
  if (!r.ok) return err(r.error);
  if (r.value !== 200 && r.value !== 201) return err({ kind: "http_failure", status: r.value });
  return ok({ templateId: null });
}

export async function importarLibraryZernio(
  apiKey: string,
  accountId: string,
  libraryTemplateName: string,
  category: string,
  language: string,
): Promise<Result<void, ZernioTemplatesError>> {
  if (!apiKey || !accountId) return err({ kind: "credencial_ausente" });
  const r = await postTemplate(apiKey, {
    accountId, name: libraryTemplateName, category: category.toUpperCase(),
    language, library_template_name: libraryTemplateName,
  });
  if (!r.ok) return err(r.error);
  if (r.value === 404) return err({ kind: "http_failure", status: 404 });
  if (r.value !== 200 && r.value !== 201) return err({ kind: "http_failure", status: r.value });
  return ok(undefined);
}
