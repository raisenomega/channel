/**
 * HUB by Raisen — Subida de media de la cita (documento/imagen/video) al bucket appointment-media.
 * Devuelve {url,type,name}; la URL publica se guarda en appointments.media. C4 <=75.
 */
import { supabaseAuthHeaders, getSupabaseUrl } from "@/lib/supabase";
import type { MediaItem } from "./agenda-types";

const BUCKET = "appointment-media";

function kind(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

export async function uploadApptMedia(tenantId: string, file: File): Promise<MediaItem | null> {
  const headers = supabaseAuthHeaders();
  const url = getSupabaseUrl();
  if (!headers || !url || !tenantId) return null;
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${encodeURIComponent(tenantId)}/${crypto.randomUUID()}.${ext}`;
  try {
    const up = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { ...headers, "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!up.ok) return null;
    return { url: `${url}/storage/v1/object/public/${BUCKET}/${path}`, type: kind(file.type), name: file.name };
  } catch {
    return null;
  }
}
