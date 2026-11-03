/**
 * HUB by Raisen — Transcribe una nota de voz (STT) para que el agente la LEA. Baja el audio de Zernio
 * (Bearer API key) y lo manda a OpenRouter whisper-large-v3-turbo (acepta ogg/opus directo, sin
 * transcodificar). Fail-safe: "" si falta llave/audio o falla (el agente cae a pedir que la escriban).
 * Validado e2e con nota de voz real. C4 <=75. Sin any.
 */
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import { fetchConTimeout } from "../../shared/infrastructure/fetch-timeout.ts";

export async function transcribirAudio(url: string, mime: string): Promise<string> {
  const stt = getEnv("OPENROUTER_API_KEY") ?? "";
  const zk = getEnv("ZERNIO_API_KEY") ?? "";
  if (!url || !stt || !zk) return "";
  try {
    const a = await fetchConTimeout(url, { headers: { Authorization: `Bearer ${zk}` } }, 30000);
    if (!a.ok) return "";
    const bytes = new Uint8Array(await a.arrayBuffer());
    const form = new FormData();
    form.append("model", "openai/whisper-large-v3-turbo");
    form.append("file", new Blob([bytes], { type: mime || "audio/ogg" }), "audio.ogg");
    const r = await fetchConTimeout("https://openrouter.ai/api/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${stt}` }, body: form }, 30000);
    if (!r.ok) return "";
    const d = (await r.json()) as { text?: string };
    return (d.text ?? "").trim();
  } catch {
    return "";
  }
}
