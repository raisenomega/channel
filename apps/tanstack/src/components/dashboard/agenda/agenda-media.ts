/**
 * HUB by Raisen — Subida de media de la cita (documento/imagen/video) al bucket appointment-media.
 * Devuelve el item o un error visible (para diagnosticar bucket/policy). C4 <=75.
 */
import { supabaseAuthHeaders, getSupabaseUrl } from "@/lib/supabase";
import { validateUpload, safeExt } from "@/lib/upload-guard";
import type { MediaItem } from "./agenda-types";

const BUCKET = "appointment-media";

function kind(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

export type UploadResult = { ok: true; item: MediaItem } | { ok: false; error: string };

export async function uploadApptMedia(tenantId: string, file: File): Promise<UploadResult> {
  const headers = supabaseAuthHeaders();
  const url = getSupabaseUrl();
  if (!headers || !url || !tenantId) return { ok: false, error: "config" };
  const v = validateUpload(file, "media");
  if (!v.ok) return { ok: false, error: v.error };
  const ext = safeExt(file.type);
  const path = `${encodeURIComponent(tenantId)}/${crypto.randomUUID()}.${ext}`;
  try {
    const up = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { ...headers, "content-type": file.type },
      body: file,
    });
    if (!up.ok) return { ok: false, error: `storage ${up.status}` };
    return { ok: true, item: { url: `${url}/storage/v1/object/public/${BUCKET}/${path}`, type: kind(file.type), name: file.name } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
