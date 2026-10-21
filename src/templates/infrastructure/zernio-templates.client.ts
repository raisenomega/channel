/**
 * HUB by Raisen — Cliente HTTP de Templates de Zernio (Slide 4.9).
 * POST /v1/whatsapp/templates (crear) + /v1/whatsapp/template-library/{name}/import.
 * Vault key via obtenerZernioApiKey. Retry con backoff. C4 <=75.
 */
import { Result, ok, err } from "../../shared/domain/result.ts";
import { conReintentos, RetryConfig } from "../../channels/infrastructure/zernio.retry.ts";

const RETRY_CFG: RetryConfig = Object.freeze({ maxIntentos: 3, backoffBaseMs: 800 });
const BASE = "https://zernio.com/api";

export interface ZernioTemplatePayload {
  readonly name: string;
  readonly language: string;
  readonly category: string;
  readonly body: string;
  readonly header?: { readonly type: string; readonly content?: string };
  readonly footer?: string;
  readonly buttons?: readonly Record<string, unknown>[];
}

export type ZernioTemplatesError =
  | { readonly kind: "credencial_ausente" }
  | { readonly kind: "http_failure"; readonly status: number }
  | { readonly kind: "red"; readonly causa: string }
  | { readonly kind: "retry_agotado"; readonly reason: string };

export async function crearTemplateZernio(
  apiKey: string,
  payload: ZernioTemplatePayload,
): Promise<Result<{ readonly templateId: string | null }, ZernioTemplatesError>> {
  if (!apiKey) return err({ kind: "credencial_ausente" });
  const r = await conReintentos(async () => {
    try {
      const res = await fetch(`${BASE}/v1/whatsapp/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      });
      return res.ok ? ok({ status: res.status, body: null as string | null }) : err({ causa: `http_${res.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }, RETRY_CFG);
  if (!r.ok) return err({ kind: "retry_agotado", reason: r.error.ultimo_error });
  if (r.value.status !== 200 && r.value.status !== 201) return err({ kind: "http_failure", status: r.value.status });
  return ok({ templateId: null });
}

export async function importarLibraryZernio(
  apiKey: string,
  libraryTemplateName: string,
  language: string,
): Promise<Result<void, ZernioTemplatesError>> {
  if (!apiKey) return err({ kind: "credencial_ausente" });
  const r = await conReintentos(async () => {
    try {
      const res = await fetch(`${BASE}/v1/whatsapp/template-library/${encodeURIComponent(libraryTemplateName)}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ language }),
      });
      return res.ok ? ok({ status: res.status }) : err({ causa: `http_${res.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }, RETRY_CFG);
  if (!r.ok) return err({ kind: "retry_agotado", reason: r.error.ultimo_error });
  if (r.value.status === 404) return err({ kind: "http_failure", status: 404 });
  if (r.value.status !== 200 && r.value.status !== 201) return err({ kind: "http_failure", status: r.value.status });
  return ok(undefined);
}