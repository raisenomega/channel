/**
 * HUB by Raisen — Path 2 del modal: envia a aprobacion de Meta (via Zernio) una plantilla enriquecida con
 * foto/link/header. No se puede EDITAR una aprobada, asi que crea una NUEVA (nombre Meta-valido [a-z_] +
 * "_custom"). NO envia mensajes: solo crea la plantilla a aprobar. C4 <=75. Sin any.
 */
import { crearTemplate } from "./functions";
import type { UsageDraft } from "./template-draft";

function normNombre(n: string): string {
  const base = n.toLowerCase().replace(/[^a-z_]+/g, "_").replace(/^_+|_+$/g, "");
  return `${base || "plantilla"}_custom`;
}

export async function enviarAprobacion(d: UsageDraft, category: string): Promise<boolean> {
  const header =
    d.headerMode === "image" && d.imageUrl.trim()
      ? { type: "image" as const, content: d.imageUrl.trim() }
      : d.headerMode === "text" && d.headerText.trim()
        ? { type: "text" as const, content: d.headerText.trim() }
        : undefined;
  const buttons = d.linkUrl.trim()
    ? [{ type: "url" as const, text: d.linkText.trim() || "Ver mas", url: d.linkUrl.trim() }]
    : undefined;
  const r = await crearTemplate({ name: normNombre(d.name), language: "es", category, body: d.body.trim(), header, buttons });
  return r.ok;
}
