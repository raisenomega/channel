/**
 * HUB by Raisen — Guardia de subidas (defensa anti web-shell/XSS): valida mime (allowlist), tamano y
 * bloquea extensiones peligrosas; deriva la extension guardada del MIME (nunca del nombre del archivo
 * del usuario -> nada de "logo.php"). La capa dura es la allowlist del bucket (migr 085); esto es la 1a
 * linea + UX. C4 <=75.
 */
export type UploadKind = "image" | "media";

const ALLOW: Record<UploadKind, readonly string[]> = {
  image: ["image/png", "image/jpeg", "image/webp"],
  media: ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
const MAX: Record<UploadKind, number> = { image: 2097152, media: 52428800 };
const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "application/pdf": "pdf",
  "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const BAD_EXT = /\.(php|phtml|php[0-9]|phar|sh|bash|cgi|pl|py|rb|exe|bat|cmd|com|js|mjs|cjs|html?|htm|svg|xml|xhtml|asp|aspx|jsp|jspx|war)$/i;

export function validateUpload(file: File, kind: UploadKind): { ok: true } | { ok: false; error: string } {
  if (!ALLOW[kind].includes(file.type)) return { ok: false, error: "tipo_no_permitido" };
  if (file.size <= 0 || file.size > MAX[kind]) return { ok: false, error: "tamano_invalido" };
  if (BAD_EXT.test(file.name)) return { ok: false, error: "extension_peligrosa" };
  return { ok: true };
}

export function safeExt(mime: string): string {
  return EXT[mime] ?? "bin";
}
